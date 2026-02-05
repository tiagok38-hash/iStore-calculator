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
    <div className="bg-white rounded-[4px] shadow-2xl w-full max-w-[600px] overflow-hidden font-roboto relative flex flex-col h-full max-h-[90vh]">
      <div className="bg-[#7000e0] p-4 flex items-center justify-between text-white h-16 shrink-0">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6" strokeWidth={1.5} />
          <h1 className="text-xl font-normal tracking-wide">Calculadora de Acréscimos</h1>
        </div>
        <div className="flex items-center gap-3">
          {onOpenAdminLogin && (
            <button onClick={onOpenAdminLogin} className="opacity-0 cursor-default p-1 rounded-full">
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1">
        <div className="p-4 pt-6 pb-6 space-y-6">
          <FormInput
            icon={<Banknote className="w-6 h-6 text-gray-500 mt-1" strokeWidth={1.5} />}
            label="Coloque o valor do produto"
            placeholder="0,00"
            helperText="Digite apenas os números."
            value={productValue}
            onChange={handleMoneyInput(setProductValue)}
            type="tel"
            prefix="R$"
          />

          <FormInput
            icon={<Wallet className="w-6 h-6 text-gray-500 mt-1" strokeWidth={1.5} />}
            label="Valor da entrada em dinheiro/Pix ou valor do seu aparelho como entrada"
            placeholder="0,00"
            helperText="Deixe em branco se não houver entrada."
            value={cashDownPayment}
            onChange={handleMoneyInput(setCashDownPayment)}
            type="tel"
            prefix="R$"
          />

          {productNum > 0 ? (
            <div className="mt-4 animate-fade-in border-t border-gray-100 pt-4">
              {financedAmountDisplay > 0 && (
                <div className="text-center mb-5">
                  <span className="text-gray-600 text-lg font-medium block sm:inline mr-1">O valor parcelado é</span>
                  <span className="text-[#7000e0] text-xl sm:text-2xl font-bold">
                    {financedAmountDisplay.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 text-center">Opções de Parcelamento</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from({ length: 21 }, (_, i) => i + 1).map((opt) => {
                  const result = calculateRow(opt);
                  if (!result) return null;
                  return (
                    <div key={opt} className="flex flex-col items-center justify-center py-5 px-1 bg-gray-50 rounded border border-gray-200 hover:border-[#7000e0] transition-colors text-center shadow-sm">
                      <div className="text-gray-800 font-bold text-sm sm:text-base whitespace-nowrap">
                        <span className="text-[#7000e0]">{opt}x</span> de {result.monthly}
                      </div>
                      <div className="text-gray-500 text-xs mt-1.5 leading-none">Total: {result.total}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 italic text-sm">Digite o valor para ver as parcelas.</div>
          )}
        </div>
      </div>
    </div>
  );
};