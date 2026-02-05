import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, ArrowLeft, Image as ImageIcon, Upload, Trash2, Loader2, Wifi, WifiOff, LogOut, Lock, Key, AlertTriangle } from 'lucide-react';
import { database } from '../services/database';

interface RateConfigProps {
  onBack: () => void;
  onLogout?: () => void;
}

export const RateConfig: React.FC<RateConfigProps> = ({ onBack, onLogout }) => {
  // Use string state to handle commas and empty fields natively
  const [displayRates, setDisplayRates] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{msg: string, type: 'success' | 'warning' | ''}>({ msg: '', type: '' });
  
  // Connection Status
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Logo state
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{text: string, error: boolean} | null>(null);

  useEffect(() => {
    // Load initial data from DB Async
    const init = async () => {
        const [r, l, connected] = await Promise.all([
            database.getRates(),
            database.getLogo(),
            database.checkConnection()
        ]);
        
        // Convert number rates to display strings (comma separated, 0 becomes empty)
        const formattedRates: Record<number, string> = {};
        // Initialize all 21 slots
        for(let i=1; i<=21; i++) {
            const val = r[i] || 0;
            formattedRates[i] = val === 0 ? '' : val.toString().replace('.', ',');
        }

        setDisplayRates(formattedRates);
        setCurrentLogo(l);
        setIsConnected(connected);
        setLoading(false);
    };
    init();
  }, []);

  // --- RATES LOGIC ---
  const handleRateChange = (installment: number, value: string) => {
    // Allow digits and a single comma
    if (/^[\d]*\,?[\d]*$/.test(value)) {
        setDisplayRates(prev => ({
            ...prev,
            [installment]: value
        }));
    }
  };

  const handleSaveRates = async () => {
    setSaving(true);
    
    // Convert display strings back to numbers for DB
    const ratesToSave: Record<number, number> = {};
    Object.entries(displayRates).forEach(([key, val]) => {
        const numVal = parseFloat((val as string).replace(',', '.'));
        ratesToSave[parseInt(key)] = isNaN(numVal) ? 0 : numVal;
    });

    const result = await database.saveRates(ratesToSave);
    setSaving(false);
    
    if (result.success) {
        setSaveStatus({ msg: 'Salvo e Sincronizado!', type: 'success' });
        setIsConnected(true);
    } else {
        const errorMsg = result.error ? `Erro: ${result.error}` : 'Erro de Permissão ou Rede';
        setSaveStatus({ msg: errorMsg, type: 'warning' });
        setIsConnected(false);
    }
    
    setTimeout(() => setSaveStatus({ msg: '', type: '' }), 5000);
  };

  // --- LOGO LOGIC (With Resize) ---
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Max width 300px is enough for the UI, keeps payload small for DB
        const MAX_WIDTH = 300; 
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // 0.8 quality jpeg is good balance
            resolve(canvas.toDataURL('image/jpeg', 0.8)); 
        } else {
            reject(new Error("Canvas Error"));
        }
      };
      img.onerror = reject;
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    
    try {
      // Resize before sending to DB to prevent "Payload too large" errors
      const base64 = await resizeImage(file);
      const result = await database.saveLogo(base64);
      
      if (result.success) {
        setCurrentLogo(base64);
        setIsConnected(true);
      } else {
        alert(`Não foi possível salvar a imagem.\nErro: ${result.error || 'Desconhecido'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao processar imagem.");
    } finally {
      setIsUploadingLogo(false);
      // Reset input so same file can be selected again if needed
      if (event.target) event.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    await database.removeLogo();
    setCurrentLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- PASSWORD LOGIC ---
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
        setPasswordMsg({ text: 'Mínimo 6 caracteres', error: true });
        return;
    }
    setChangingPassword(true);
    setPasswordMsg(null);
    
    try {
        await database.updatePassword(newPassword);
        setPasswordMsg({ text: 'Senha alterada com sucesso!', error: false });
        setNewPassword('');
    } catch (e: any) {
        setPasswordMsg({ text: 'Erro ao alterar senha.', error: true });
    } finally {
        setChangingPassword(false);
    }
  };

  // 1 to 21
  const installmentOptions = Array.from({ length: 21 }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-[4px] shadow-2xl w-full max-w-[600px] overflow-hidden font-roboto animate-fade-in flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="bg-[#4a4a4a] p-4 flex items-center justify-between text-white h-16 shrink-0">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" strokeWidth={1.5} />
          <h1 className="text-xl font-normal tracking-wide">Configurações</h1>
        </div>
        <div className="flex items-center gap-2">
            {onLogout && (
                <button onClick={onLogout} className="text-white/80 hover:text-white transition-colors p-1" title="Sair">
                    <LogOut className="w-5 h-5" />
                </button>
            )}
            <button onClick={onBack} className="text-white hover:text-gray-300 transition-colors ml-1">
            <ArrowLeft className="w-6 h-6" />
            </button>
        </div>
      </div>

      {/* Connection Status Bar */}
      <div className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
         {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
         {isConnected ? 'Modo Admin: Conectado' : 'Atenção: Sem conexão ou permissão'}
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        
        {loading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        ) : (
            <>
            {/* Section: Rates */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">Taxas de Juros (%)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                    {installmentOptions.map((num) => (
                    <div key={num} className="flex flex-col">
                        <label className="text-gray-600 text-xs font-bold mb-0.5">
                        {num}x
                        </label>
                        <div className="flex items-center border-b border-gray-300 focus-within:border-[#7000e0]">
                        <input
                            type="text"
                            inputMode="decimal"
                            value={displayRates[num] || ''}
                            onChange={(e) => handleRateChange(num, e.target.value)}
                            placeholder="0,0"
                            className="w-full py-1.5 bg-transparent outline-none text-gray-700 text-sm placeholder-gray-300"
                        />
                        <span className="text-gray-400 text-xs font-bold">%</span>
                        </div>
                    </div>
                    ))}
                </div>

                <div className="mt-6 flex flex-col gap-2">
                    <button
                    onClick={handleSaveRates}
                    disabled={saving}
                    className={`w-full flex items-center justify-center gap-2 font-medium py-3 rounded-[4px] shadow-sm tracking-wider text-sm transition-all duration-200 uppercase ${
                        saveStatus.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 
                        saveStatus.type === 'warning' ? 'bg-orange-500 hover:bg-orange-600' :
                        'bg-[#4a4a4a] hover:bg-[#333]'
                    } text-white disabled:opacity-70`}
                    >
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saveStatus.msg && saveStatus.type !== 'warning' ? saveStatus.msg : saving ? 'Salvando...' : 'Salvar Taxas'}
                    </button>
                    
                    {saveStatus.type === 'warning' && (
                        <div className="flex items-center gap-2 text-[11px] text-orange-600 bg-orange-50 p-2 rounded justify-center">
                            <AlertTriangle className="w-3 h-3" />
                            {saveStatus.msg}
                        </div>
                    )}
                </div>
            </div>

            {/* Section: Brand Identity (Logo) */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                    <ImageIcon className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-bold text-gray-800">Identidade Visual</h2>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded border border-gray-100">
                    <div className="w-20 h-20 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden shrink-0">
                        {isUploadingLogo ? (
                            <Loader2 className="animate-spin text-[#7000e0]" />
                        ) : currentLogo ? (
                        <img src={currentLogo} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                        <span className="text-xs text-gray-400 text-center px-1">Logo Padrão</span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full">
                        <button 
                        onClick={triggerFileInput}
                        disabled={isUploadingLogo}
                        className="flex items-center justify-center gap-2 bg-[#7000e0] hover:bg-[#5f00be] text-white px-4 py-2 rounded text-xs uppercase font-bold transition-colors w-full sm:w-auto disabled:opacity-50"
                        >
                        <Upload size={14} />
                        {isUploadingLogo ? 'Processando...' : 'Carregar Logo'}
                        </button>
                        <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        />
                        
                        {currentLogo && (
                        <button 
                            onClick={handleRemoveLogo}
                            className="flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded text-xs uppercase font-bold transition-colors w-full sm:w-auto"
                        >
                            <Trash2 size={14} />
                            Restaurar Padrão
                        </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Section: Security (Password) */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                    <Lock className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-bold text-gray-800">Segurança</h2>
                </div>
                
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                    <label className="text-gray-600 text-xs font-bold mb-1 block">
                        Nova Senha de Acesso
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); setPasswordMsg(null); }}
                                placeholder="Digite a nova senha..."
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-[#7000e0]"
                            />
                        </div>
                        <button 
                            onClick={handleChangePassword}
                            disabled={changingPassword || !newPassword}
                            className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded text-xs uppercase font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2"
                        >
                            {changingPassword && <Loader2 className="w-3 h-3 animate-spin" />}
                            Alterar Senha
                        </button>
                    </div>
                    {passwordMsg && (
                        <p className={`text-xs mt-2 ${passwordMsg.error ? 'text-red-600' : 'text-green-600'}`}>
                            {passwordMsg.text}
                        </p>
                    )}
                </div>
            </div>

            </>
        )}

      </div>
    </div>
  );
};