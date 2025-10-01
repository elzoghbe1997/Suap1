import React, { useState, useContext, useMemo, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type, LiveServerMessage, Modality, Blob } from "@google/genai";
import { AppContext } from '../App';
import { AppContextType, Transaction, TransactionType, ExpenseCategory, CropCycle } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { AddIcon, EditIcon, DeleteIcon, DocumentSearchIcon, SparklesIcon, MicrophoneIcon, CloseIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import LoadingSpinner from './LoadingSpinner';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm";
const formLabelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
const filterInputClass = "block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";


const TransactionForm: React.FC<{ transaction?: Partial<Transaction>; onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void; onCancel: () => void; cycles: CropCycle[] }> = ({ transaction, onSave, onCancel, cycles }) => {
    const { addToast } = useContext(ToastContext) as ToastContextType;
    const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
    const [cropCycleId, setCropCycleId] = useState(transaction?.cropCycleId || (cycles.length > 0 ? cycles.find(c => c.status === 'نشطة')?.id || '' : ''));
    
    const [quantityGrade1, setQuantityGrade1] = useState(transaction?.quantityGrade1?.toString() || '');
    const [priceGrade1, setPriceGrade1] = useState(transaction?.priceGrade1?.toString() || '');
    const [quantityGrade2, setQuantityGrade2] = useState(transaction?.quantityGrade2?.toString() || '');
    const [priceGrade2, setPriceGrade2] = useState(transaction?.priceGrade2?.toString() || '');
    const [discount, setDiscount] = useState(transaction?.discount?.toString() || '');

    const { subtotal, totalAmount } = useMemo(() => {
        const q1 = Number(quantityGrade1) || 0;
        const p1 = Number(priceGrade1) || 0;
        const q2 = Number(quantityGrade2) || 0;
        const p2 = Number(priceGrade2) || 0;
        const d = Number(discount) || 0;

        const subtotalCalc = (q1 * p1) + (q2 * p2);
        const totalAmountCalc = subtotalCalc - d;
        return { subtotal: subtotalCalc, totalAmount: totalAmountCalc };
    }, [quantityGrade1, priceGrade1, quantityGrade2, priceGrade2, discount]);
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(amount);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !cropCycleId) {
             addToast("يرجى التأكد من اختيار التاريخ والعروة.", "error");
            return;
        }

        const q1 = Number(quantityGrade1) || 0;
        const p1 = Number(priceGrade1) || 0;
        const q2 = Number(quantityGrade2) || 0;
        const p2 = Number(priceGrade2) || 0;
        const d = Number(discount) || 0;

        const calculatedAmount = (q1 * p1) + (q2 * p2) - d;
        const totalQuantity = q1 + q2;

        if (calculatedAmount <= 0 && totalQuantity <= 0) {
            addToast("يرجى إدخال كمية وسعر صالحين.", "error");
            return;
        }

        const data = { 
            date, 
            description: `فاتورة بيع محصول`, 
            type: TransactionType.REVENUE, 
            category: ExpenseCategory.OTHER, 
            amount: calculatedAmount, 
            cropCycleId,
            quantity: totalQuantity,
            quantityGrade1: q1,
            priceGrade1: p1,
            quantityGrade2: q2,
            priceGrade2: p2,
            discount: d,
        };

        if (transaction?.id) {
            onSave({ ...transaction, ...data, id: transaction.id });
        } else {
            onSave(data);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">تفاصيل الفاتورة</h3>
                <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                    <fieldset>
                        <legend className="text-base font-medium text-gray-800 dark:text-gray-200">الصنف الأول (نمرة 1)</legend>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="quantityGrade1" className={formLabelClass}>الكمية (ك.ج)</label>
                                <input type="number" id="quantityGrade1" value={quantityGrade1} onChange={e => setQuantityGrade1(e.target.value)} min="0" step="any" className={formInputClass} />
                            </div>
                            <div>
                                <label htmlFor="priceGrade1" className={formLabelClass}>سعر الكيلو (ج.م)</label>
                                <input type="number" id="priceGrade1" value={priceGrade1} onChange={e => setPriceGrade1(e.target.value)} min="0" step="any" className={formInputClass} />
                            </div>
                        </div>
                    </fieldset>
                     <fieldset>
                        <legend className="text-base font-medium text-gray-800 dark:text-gray-200">الصنف الثاني (نمرة 2)</legend>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="quantityGrade2" className={formLabelClass}>الكمية (ك.ج)</label>
                                <input type="number" id="quantityGrade2" value={quantityGrade2} onChange={e => setQuantityGrade2(e.target.value)} min="0" step="any" className={formInputClass} />
                            </div>
                            <div>
                                <label htmlFor="priceGrade2" className={formLabelClass}>سعر الكيلو (ج.م)</label>
                                <input type="number" id="priceGrade2" value={priceGrade2} onChange={e => setPriceGrade2(e.target.value)} min="0" step="any" className={formInputClass} />
                            </div>
                        </div>
                    </fieldset>
                </div>
            </div>

            <div>
                 <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">الإجمالي والخصم</h3>
                 <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                     <div>
                        <label htmlFor="discount" className={formLabelClass}>الخصم (ج.م)</label>
                        <input type="number" id="discount" value={discount} onChange={e => setDiscount(e.target.value)} min="0" step="any" className={formInputClass} />
                    </div>
                     <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">الإجمالي الفرعي:</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(subtotal)}</span>
                        </div>
                         <div className="flex justify-between items-center mt-1">
                            <span className="text-gray-600 dark:text-gray-400">الخصم:</span>
                            <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(Number(discount) || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <span className="font-bold text-gray-900 dark:text-white">الإجمالي النهائي:</span>
                            <span className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                 </div>
            </div>
            
            <div>
                 <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">معلومات إضافية</h3>
                 <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className={formLabelClass}>تاريخ الفاتورة</label>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={formInputClass}/>
                    </div>
                     <div>
                        <label htmlFor="cropCycle" className={formLabelClass}>العروة المرتبطة</label>
                        <select id="cropCycle" value={cropCycleId} onChange={e => setCropCycleId(e.target.value)} required className={formInputClass}>
                            <option value="" disabled>اختر عروة</option>
                            {cycles.filter(c => c.status === 'نشطة').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                 </div>
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">حفظ الفاتورة</button>
            </div>
        </form>
    );
};

const AIInvoiceModal: React.FC<{onClose: () => void; onGenerate: (data: Partial<Transaction>) => void;}> = ({ onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useContext(ToastContext) as ToastContextType;
    
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            addToast("يرجى إدخال وصف الفاتورة.", "warning");
            return;
        }
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `أنت مساعد خبير في استخلاص البيانات. من النص التالي، استخرج تفاصيل الفاتورة وقدمها بصيغة JSON. النص هو: "${prompt}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            quantityGrade1: { type: Type.NUMBER, description: 'كمية الصنف الأول بالكيلوجرام' },
                            priceGrade1: { type: Type.NUMBER, description: 'سعر الكيلوجرام للصنف الأول بالجنيه المصري' },
                            quantityGrade2: { type: Type.NUMBER, description: 'كمية الصنف الثاني بالكيلوجرام' },
                            priceGrade2: { type: Type.NUMBER, description: 'سعر الكيلوجرام للصنف الثاني بالجنيه المصري' },
                            discount: { type: Type.NUMBER, description: 'قيمة الخصم الإجمالية بالجنيه المصري' },
                        },
                    },
                },
            });
            
            const parsedJson = JSON.parse(response.text);
            onGenerate({
                quantityGrade1: parsedJson.quantityGrade1 || undefined,
                priceGrade1: parsedJson.priceGrade1 || undefined,
                quantityGrade2: parsedJson.quantityGrade2 || undefined,
                priceGrade2: parsedJson.priceGrade2 || undefined,
                discount: parsedJson.discount || undefined,
            });
            onClose();

        } catch(error) {
            console.error("AI Invoice generation failed:", error);
            addToast("لم أتمكن من فهم الوصف. يرجى المحاولة مرة أخرى بصيغة أوضح.", "error");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                    <SparklesIcon className="w-6 h-6 ml-2 text-yellow-400" />
                    إنشاء فاتورة بالذكاء الاصطناعي
                </h2>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    اكتب تفاصيل الفاتورة باللغة العربية، وسيقوم الذكاء الاصطناعي بتعبئة الحقول.
                    <br/>
                    مثال: <span className="italic">"تم بيع 150 كيلو طماطم نمرة 1 بسعر 30 جنيه، و 70 كيلو نمرة 2 بسعر 25 جنيه، مع خصم 200 جنيه"</span>
                </p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="اكتب تفاصيل الفاتورة هنا..."
                    rows={4}
                    className={`${formInputClass} text-base`}
                    disabled={isLoading}
                />
                <div className="flex justify-end space-x-2 space-x-reverse pt-4 mt-2">
                    <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50">إلغاء</button>
                    <button type="button" onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:bg-green-800">
                        {isLoading ? <LoadingSpinner /> : 'إنشاء وتعبئة'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const VoiceInvoiceModal: React.FC<{
  onClose: () => void;
  onComplete: (transcript: string) => void;
}> = ({ onClose, onComplete }) => {
  const { addToast } = useContext(ToastContext) as ToastContextType;
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(true);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const fullTranscriptRef = useRef('');

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
  };

  const stopRecording = useCallback(() => {
    setIsListening(false);
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
    }
    if (sourceRef.current) sourceRef.current.disconnect();
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  const handleComplete = useCallback(() => {
    stopRecording();
    onComplete(fullTranscriptRef.current);
  }, [stopRecording, onComplete]);
  
  const handleCancel = () => {
    stopRecording();
    onClose();
  };


  useEffect(() => {
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        // FIX: Cast window to `any` to allow for `webkitAudioContext` for broader browser compatibility.
        inputAudioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        
        sessionPromiseRef.current = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
              sourceRef.current = source;
              const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
              scriptProcessorRef.current = scriptProcessor;

              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromiseRef.current?.then(session => {
                  if (session) session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContextRef.current!.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                fullTranscriptRef.current += text;
                setTranscript(prev => prev + text);
              }
              if (message.serverContent?.turnComplete) {
                handleComplete();
              }
            },
            onerror: (e: ErrorEvent) => {
              console.error('Live session error:', e);
              addToast('حدث خطأ في الاتصال الصوتي.', 'error');
              handleCancel();
            },
            onclose: (e: CloseEvent) => {
              console.debug('Live session closed');
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
          },
        });
      } catch (err) {
        console.error('Failed to get microphone access:', err);
        addToast('لم يتم السماح بالوصول إلى الميكروفون.', 'error');
        onClose();
      }
    };

    startRecording();
    
    return () => {
      stopRecording();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog" onClick={handleCancel}>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                    <MicrophoneIcon className="w-6 h-6 ml-2 text-red-500" />
                    تحدث لإنشاء فاتورة
                </h2>
                <button onClick={handleCancel} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
            </div>
            <div className="my-6 text-center">
                 <div className="flex justify-center items-center">
                    <div className={`relative flex items-center justify-center h-20 w-20 rounded-full ${isListening ? 'bg-red-100 dark:bg-red-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        {isListening && <div className="absolute h-full w-full bg-red-500 rounded-full animate-ping"></div>}
                        <MicrophoneIcon className={`h-10 w-10 z-10 ${isListening ? 'text-red-500' : 'text-gray-500'}`} />
                    </div>
                </div>
                 <p className={`mt-4 text-lg font-semibold ${isListening ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isListening ? 'جاري الاستماع...' : 'انتهى التسجيل، جاري المعالجة...'}
                 </p>
            </div>
            <div className="min-h-[80px] p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-300">{transcript || "..."}</p>
            </div>
            <div className="flex justify-center pt-4 mt-2">
                <button type="button" onClick={handleComplete} disabled={!isListening} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:bg-red-800">
                    إنهاء التسجيل
                </button>
            </div>
        </div>
    </div>
  );
};


const EmptyState: React.FC<{ message: string; subMessage: string; icon: React.ReactNode }> = ({ message, subMessage, icon }) => (
    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-500">{icon}</div>
        <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">{message}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subMessage}</p>
    </div>
);

const SkeletonList: React.FC = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
             <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3 animate-pulse">
                <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1 pr-2">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
                <div className="flex justify-end items-center">
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const InvoicesPage: React.FC = () => {
    const { loading, transactions, cropCycles, addTransaction, updateTransaction, deleteTransaction } = useContext(AppContext) as AppContextType;
    const { addToast } = useContext(ToastContext) as ToastContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [isParsingVoice, setIsParsingVoice] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Partial<Transaction> | undefined>(undefined);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filterCycle, setFilterCycle] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(amount);
    
    const handleSave = (transaction: Omit<Transaction, 'id'> | Transaction) => {
        if ('id' in transaction && transaction.id) {
            updateTransaction(transaction as Transaction);
        } else {
            addTransaction(transaction);
        }
        setIsModalOpen(false);
        setEditingTransaction(undefined);
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };
    
    const handleDelete = (id: string) => {
        setDeletingId(id);
    };
    
    const handleAiGenerate = (data: Partial<Transaction>) => {
        setEditingTransaction(data);
        setIsModalOpen(true);
    };

    const parseTranscriptWithAI = async (transcript: string) => {
        setIsParsingVoice(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `أنت مساعد خبير في استخلاص البيانات. من النص التالي، استخرج تفاصيل الفاتورة وقدمها بصيغة JSON. النص هو: "${transcript}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            quantityGrade1: { type: Type.NUMBER, description: 'كمية الصنف الأول بالكيلوجرام' },
                            priceGrade1: { type: Type.NUMBER, description: 'سعر الكيلوجرام للصنف الأول بالجنيه المصري' },
                            quantityGrade2: { type: Type.NUMBER, description: 'كمية الصنف الثاني بالكيلوجرام' },
                            priceGrade2: { type: Type.NUMBER, description: 'سعر الكيلوجرام للصنف الثاني بالجنيه المصري' },
                            discount: { type: Type.NUMBER, description: 'قيمة الخصم الإجمالية بالجنيه المصري' },
                        },
                    },
                },
            });
            const parsedJson = JSON.parse(response.text);
            handleAiGenerate({
                quantityGrade1: parsedJson.quantityGrade1 || undefined,
                priceGrade1: parsedJson.priceGrade1 || undefined,
                quantityGrade2: parsedJson.quantityGrade2 || undefined,
                priceGrade2: parsedJson.priceGrade2 || undefined,
                discount: parsedJson.discount || undefined,
            });
        } catch(error) {
            console.error("AI Transcript parsing failed:", error);
            addToast("لم أتمكن من فهم الصوت. يرجى المحاولة مرة أخرى بصوت أوضح.", "error");
        } finally {
            setIsParsingVoice(false);
        }
    };

    const handleVoiceComplete = (transcript: string) => {
        setIsVoiceModalOpen(false);
        if (transcript.trim()) {
            parseTranscriptWithAI(transcript);
        } else {
            addToast("لم يتم تسجيل أي صوت.", "warning");
        }
    };


    const confirmDelete = () => {
        if (deletingId) {
            deleteTransaction(deletingId);
        }
        setDeletingId(null);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const typeMatch = t.type === TransactionType.REVENUE;
            const cycleMatch = filterCycle === 'all' || t.cropCycleId === filterCycle;
            
            let dateMatch = true;
            if (dateRange.start || dateRange.end) {
                const transactionDate = new Date(t.date);
                const startDate = dateRange.start ? new Date(dateRange.start) : null;
                const endDate = dateRange.end ? new Date(dateRange.end) : null;
                if (startDate) startDate.setHours(0, 0, 0, 0);
                if (endDate) endDate.setHours(23, 59, 59, 999);
                
                dateMatch = (!startDate || transactionDate >= startDate) && (!endDate || transactionDate <= endDate);
            }

            return typeMatch && cycleMatch && dateMatch;
        });
    }, [transactions, filterCycle, dateRange]);

    const renderContent = () => {
        if (loading) {
            return <SkeletonList />;
        }
        if (filteredTransactions.length > 0) {
            return (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        {['التاريخ', 'الوصف', 'العروة', 'إجمالي الكمية', 'المبلغ الإجمالي', 'الإجراءات'].map(h => 
                                        <th key={h} className="py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredTransactions.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="py-4 px-4 whitespace-nowrap">{t.date}</td>
                                            <td className="py-4 px-4 whitespace-nowrap">{t.description}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{cropCycles.find(c => c.id === t.cropCycleId)?.name ?? 'غير محدد'}</td>
                                            <td className="py-4 px-4 whitespace-nowrap">{t.quantity ? `${t.quantity.toLocaleString('en-US')} ك.ج` : '-'}</td>
                                            <td className="py-4 px-4 whitespace-nowrap font-medium text-green-600">{formatCurrency(t.amount)}</td>
                                            <td className="py-4 px-4 whitespace-nowrap font-medium">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <button onClick={() => handleEdit(t)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><EditIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><DeleteIcon className="w-5 h-5"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {filteredTransactions.map(t => (
                            <div key={t.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className='flex-1 pr-2'>
                                        <p className="font-bold text-gray-800 dark:text-white">{cropCycles.find(c => c.id === t.cropCycleId)?.name ?? 'فاتورة'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.date}</p>
                                    </div>
                                    <p className="font-semibold text-lg text-green-600 whitespace-nowrap">{formatCurrency(t.amount)}</p>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                                {(t.quantityGrade1 ?? 0) > 0 && <p><strong className="font-medium text-gray-700 dark:text-gray-300">نمرة 1:</strong> {t.quantityGrade1} ك.ج × {formatCurrency(t.priceGrade1 || 0)}</p>}
                                {(t.quantityGrade2 ?? 0) > 0 && <p><strong className="font-medium text-gray-700 dark:text-gray-300">نمرة 2:</strong> {t.quantityGrade2} ك.ج × {formatCurrency(t.priceGrade2 || 0)}</p>}
                                {(t.discount ?? 0) > 0 && <p><strong className="font-medium text-gray-700 dark:text-gray-300">خصم:</strong> <span className="text-red-600">{formatCurrency(t.discount!)}</span></p>}
                                </div>
                                <div className="flex justify-end items-center">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <button onClick={() => handleEdit(t)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full"><DeleteIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            );
        }
        return (
             <EmptyState
                message="لا توجد فواتير تطابق بحثك"
                subMessage="جرّب تغيير الفلاتر أو إضافة فاتورة جديدة."
                icon={<DocumentSearchIcon className="w-16 h-16"/>}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                 <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingTransaction(undefined); setIsModalOpen(true); }} className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                        <AddIcon className="w-5 h-5 ml-2" />
                        <span>إضافة فاتورة</span>
                    </button>
                    <button onClick={() => setIsAiModalOpen(true)} className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-yellow-500 text-white rounded-md shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-colors">
                        <SparklesIcon className="w-5 h-5 ml-2" />
                        <span>إنشاء بـ AI</span>
                    </button>
                    <button onClick={() => setIsVoiceModalOpen(true)} disabled={isParsingVoice} className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors disabled:opacity-50 disabled:bg-red-800">
                        <MicrophoneIcon className="w-5 h-5 ml-2" />
                        <span>{isParsingVoice ? 'جاري المعالجة...' : 'إضافة بالصوت'}</span>
                    </button>
                 </div>
                 <div className="flex-grow flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <label htmlFor="filterCycle" className="sr-only">فلترة حسب العروة</label>
                        <select id="filterCycle" value={filterCycle} onChange={e => setFilterCycle(e.target.value)} className={filterInputClass}>
                            <option value="all">كل العروات</option>
                            {cropCycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div className="flex-1 min-w-[150px]">
                        <label htmlFor="startDate" className="sr-only">من تاريخ</label>
                        <input type="date" id="startDate" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className={filterInputClass}/>
                    </div>
                     <div className="flex-1 min-w-[150px]">
                        <label htmlFor="endDate" className="sr-only">إلى تاريخ</label>
                        <input type="date" id="endDate" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className={filterInputClass}/>
                    </div>
                </div>
            </div>

            {renderContent()}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{editingTransaction?.id ? 'تعديل فاتورة' : 'إضافة فاتورة جديدة'}</h2>
                        <TransactionForm 
                            transaction={editingTransaction}
                            onSave={handleSave} 
                            onCancel={() => { setIsModalOpen(false); setEditingTransaction(undefined); }} 
                            cycles={cropCycles} 
                        />
                    </div>
                </div>
            )}
            
            {isAiModalOpen && (
                <AIInvoiceModal 
                    onClose={() => setIsAiModalOpen(false)}
                    onGenerate={handleAiGenerate}
                />
            )}

            {isVoiceModalOpen && (
                <VoiceInvoiceModal 
                    onClose={() => setIsVoiceModalOpen(false)}
                    onComplete={handleVoiceComplete}
                />
            )}
            
            <ConfirmationModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={confirmDelete}
                title="تأكيد الحذف"
                message="هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء."
            />
        </div>
    );
};

export default InvoicesPage;