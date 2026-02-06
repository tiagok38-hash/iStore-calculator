import React, { useState, useEffect } from 'react';
import { Calculator, Banknote, Settings, Wallet } from 'lucide-react';
import { FormInput } from './FormInput';
import { database, supabase, KEYS } from '../services/database';

interface CalculatorCardProps {
  onOpenAdminLogin?: () => void;
}

export const CalculatorCard: React.FC<CalculatorCardProps> = ({ onOpenAdminLogin }) => {
  const [productValue, setProductValue] = useState<string>('');
  const [cashDownPayment, setCashDownPayment] = useState<string>('');
  const [rates, setRates] = useState<Record<number, number>>(() => database.getCachedRates());
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Sincronização em background para não travar a abertura
    const syncData = async () => {
      const [loadedRates, connected] = await Promise.all([
        database.getRates(),
        database.checkConnection()
      ]);
      setRates(loadedRates);
      setIsConnected(connected);
    };
    syncData();

    const channel = supabase.channel('rates-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'istore_config' }, (payload) => {
        if (payload.new && payload.new.rates) {
          setRates(payload.new.rates);
          localStorage.setItem(KEYS.RATES, JSON.stringify(payload.new.rates));
          setIsConnected(true);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const parseMoney = (value: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  };

  const handleMoneyInput = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') { setter(''); return; }
    const numberValue = parseFloat(value) / 100;
    setter(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  };

  const productNum = parseMoney(productValue);
  const cashNum = parseMoney(cashDownPayment);
  const financedAmountDisplay = productNum - cashNum;

  const calculateRow = (installments: number) => {
    const financedAmount = productNum - cashNum;
    if (financedAmount <= 0) return null;
    const rate = rates[installments] ?? 0;
    const totalWithInterest = financedAmount * (1 + rate / 100);
    return {
      monthly: (totalWithInterest / installments).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      total: totalWithInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    };
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-[550px] overflow-hidden font-roboto relative flex flex-col h-full max-h-[90vh] border border-white/50 ring-1 ring-purple-100/50 transition-all duration-300">

      {/* Header Premium */}
      <div className="bg-gradient-to-r from-[#7000e0] to-[#8b2ce8] p-6 flex items-center justify-between text-white shrink-0 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
            <Calculator className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Calculadora iStore</h1>
            <p className="text-[10px] text-purple-100 font-medium tracking-wider uppercase opacity-90">Simulador de Parcelamento</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          {onOpenAdminLogin && (
            <button
              onClick={onOpenAdminLogin}
              className="opacity-0 cursor-default p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-white to-purple-50/30">
        <div className="p-6 space-y-7">

          <div className="space-y-5">
            <FormInput
              icon={<Banknote className="w-5 h-5 text-[#7000e0]" strokeWidth={1.5} />}
              label="Valor do Produto"
              placeholder="0,00"
              helperText="Digite o valor total do aparelho"
              value={productValue}
              onChange={handleMoneyInput(setProductValue)}
              type="tel"
              prefix="R$"
            />

            <FormInput
              icon={<Wallet className="w-5 h-5 text-[#7000e0]" strokeWidth={1.5} />}
              label="Valor de entrada (Dinheiro/Pix/Aparelho)"
              placeholder="0,00"
              helperText="Deixe vazio se for sem entrada"
              value={cashDownPayment}
              onChange={handleMoneyInput(setCashDownPayment)}
              type="tel"
              prefix="R$"
            />
          </div>

          {productNum > 0 ? (
            <div className="mt-2 animate-fade-in">
              {financedAmountDisplay > 0 && (
                <div className="flex flex-row items-center justify-center gap-2 mb-4 mt-2">
                  <span className="text-gray-500 text-sm font-medium tracking-wide">O valor parcelado é</span>
                  <span className="text-[#7000e0] text-xl font-black tracking-tight drop-shadow-sm">
                    {financedAmountDisplay.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] text-center mb-4">Opções Disponíveis</h3>

                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 21 }, (_, i) => i + 1).map((opt) => {
                    const result = calculateRow(opt);
                    if (!result) return null;
                    return (
                      <div key={opt} className="group flex flex-col items-center justify-center py-2.5 px-1 bg-white hover:bg-[#7000e0] rounded-xl border border-purple-100 hover:border-[#7000e0] transition-all duration-200 text-center shadow-[0_2px_8px_-4px_rgba(112,0,224,0.15)] hover:shadow-[0_8px_16px_-6px_rgba(112,0,224,0.3)] hover:-translate-y-0.5 cursor-default">
                        <div className="text-gray-700 group-hover:text-white font-bold text-xs sm:text-sm whitespace-nowrap transition-colors">
                          <span className="text-[#8b2ce8] group-hover:text-purple-200">{opt}x</span> <span className="text-[10px] opacity-70 font-normal">de</span> {result.monthly}
                        </div>
                        <div className="text-gray-400 group-hover:text-purple-100 text-[10px] mt-1 font-bold transition-colors">Total: {result.total}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <a
                  href="https://wa.me/5581973164090"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#7000e0] hover:text-[#5a00b3] transition-colors group"
                >
                  <span className="font-medium text-sm">Falar com nosso vendedor</span>
                  <div className="bg-[#25D366] text-white p-1.5 rounded-full group-hover:bg-[#128C7E] transition-colors shadow-lg shadow-green-200">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center opacity-60">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                <Calculator className="w-6 h-6 text-purple-300" />
              </div>
              <p className="text-gray-400 text-sm font-medium">Preencha os valores para simular</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};