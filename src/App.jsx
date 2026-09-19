import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Save, Undo, Eraser, Trash2, 
  PenTool, User, MapPin, LogOut, Download, 
  Grid, Plus, ChevronLeft, Clock, AlignLeft, Eye, MessageCircle, Image as ImageIcon, Lock, Mail, Key, ShieldCheck, Maximize2, Check, X, Loader2
} from 'lucide-react';

// ==========================================
// 1. НАСТРОЙКИ ОБЛАКА FIREBASE
// ==========================================
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyACobwO_XL-QfUWRidjqL1S7O4neiFDYug",
  authDomain: "tvzone-fd220.firebaseapp.com",
  projectId: "tvzone-fd220",
  storageBucket: "tvzone-fd220.firebasestorage.app",
  messagingSenderId: "612832778880",
  appId: "1:612832778880:web:8df29d81563844f0c9a465",
  measurementId: "G-9BN3DEZ82Y"
};

// Запуск облака
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 2. НАСТРОЙКИ ПОЧТЫ EMAILJS
// ==========================================
const EMAILJS_SERVICE_ID = 'service_2a1dntp';
const EMAILJS_TEMPLATE_ID = 'template_m0v01p4';
const EMAILJS_PUBLIC_KEY = 'YTs6RNUvAjy1zicxk';

const translations = {
  ru: {
    sys_name: "TVZONE", sys_sub: "Spatial Workspace",
    auth_title: "Авторизация доступа", auth_tab_login: "Вход", auth_tab_reg: "Регистрация",
    auth_email: "Корпоративная почта", auth_pass: "Пароль", auth_name: "Имя / Позывной мастера",
    auth_btn_login: "Войти в систему", auth_btn_reg: "Отправить код на почту",
    auth_verify_title: "Подтверждение почты", auth_verify_desc: "Введите 6-значный код из письма, отправленного на почту",
    auth_verify_btn: "Подтвердить и завершить", auth_resend: "Отправить код повторно",
    nav_new: "Новый замер", nav_history: "База проектов",
    form_address: "Адрес объекта", form_comment: "Технические детали", form_save: "Сохранить проект",
    hist_author: "Ответственный:", hist_empty: "Пространство проектов пусто", detail_title: "Карточка проекта",
    btn_download: "Сохранить", btn_whatsapp: "В WhatsApp", btn_back: "Назад к списку",
    btn_camera: "Сделать фото", btn_gallery: "Из галереи", btn_done_fullscreen: "Готово / Закрыть",
    btn_close_photo: "Закрыть фото"
  },
  kz: {
    sys_name: "TVZONE", sys_sub: "Spatial Workspace",
    auth_title: "Қолжетімділік автосаудасы", auth_tab_login: "Кіру", auth_tab_reg: "Тіркелу",
    auth_email: "Корпоративтік пошта", auth_pass: "Құпия сөз", auth_name: "Аты / Шебер аты",
    auth_btn_login: "Жүйеге кіру", auth_btn_reg: "Поштаға код жіберу",
    auth_verify_title: "Поштаны растау", auth_verify_desc: "Поштаға келген 6 таңбалы кодты енгізіңіз",
    auth_verify_btn: "Растау және аяқтау", auth_resend: "Кодты қайта жіберу",
    nav_new: "Жаңа өлшем", nav_history: "Жобалар базасы",
    form_address: "Нысан мекенжайы", form_comment: "Техникалық бөлшектер", form_save: "Жобаны сақтау",
    hist_author: "Жауапты:", hist_empty: "Жобалар кеңістігі бос", detail_title: "Жоба картасы",
    btn_download: "Сақтау", btn_whatsapp: "WhatsApp-қа", btn_back: "Тізімге қайту",
    btn_camera: "Суретке түсіру", btn_gallery: "Галереядан", btn_done_fullscreen: "Дайын / Жабу",
    btn_close_photo: "Суретті жабу"
  },
  en: {
    sys_name: "TVZONE", sys_sub: "Spatial Workspace",
    auth_title: "Access Authorization", auth_tab_login: "Login", auth_tab_reg: "Register",
    auth_email: "Corporate Email", auth_pass: "Password", auth_name: "Master Name",
    auth_btn_login: "Enter System", auth_btn_reg: "Send Code to Email",
    auth_verify_title: "Email Verification", auth_verify_desc: "Enter the 6-digit code sent to your email",
    auth_verify_btn: "Verify & Complete", auth_resend: "Resend Code",
    nav_new: "New Measurement", nav_history: "Project Database",
    form_address: "Object Address", form_comment: "Technical Details", form_save: "Save Project",
    hist_author: "Assigned to:", hist_empty: "Project space is empty", detail_title: "Project Card",
    btn_download: "Download", btn_whatsapp: "WhatsApp", btn_back: "Back to list",
    btn_camera: "Take Photo", btn_gallery: "From Gallery", btn_done_fullscreen: "Done / Close",
    btn_close_photo: "Close photo"
  }
};

const SpatialWindow = ({ children, className = '' }) => (
  <div className={`bg-white/[0.04] backdrop-blur-[40px] border border-white/[0.08] shadow-[0_30px_80px_rgba(0,0,0,0.6)] rounded-[28px] ${className}`}>
    {children}
  </div>
);

const normalizeImageOrientation = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1920;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.85)); 
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

export default function App() {
  const [lang, setLang] = useState('ru');
  const t = translations[lang];
  
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tvzone_auth_user')); } 
    catch { return null; }
  });

  const [authMode, setAuthMode] = useState('login');
  const [authStep, setAuthStep] = useState('form');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [verificationInput, setVerificationInput] = useState('');

  const [activePage, setActivePage] = useState('new'); 
  const [uploadedImage, setUploadedImage] = useState(null);
  const [clientAddress, setClientAddress] = useState('');
  const [comment, setComment] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isFullscreenDraw, setIsFullscreenDraw] = useState(false);

  const canvasRef = useRef(null);
  const fsCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const fsImageRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [tool, setTool] = useState('pen'); 
  const [brushSize, setBrushSize] = useState(4);
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);

  useEffect(() => {
    if (currentUser) {
      const projectsRef = ref(db, 'projects');
      const unsubscribe = onValue(projectsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const projectsArray = Object.values(data).sort((a, b) => b.id - a.id);
          setHistory(projectsArray);
        } else {
          setHistory([]);
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const generateSixDigitCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const sendEmailViaEmailJS = async (email, name, code) => {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: { to_email: email, to_name: name, code: code }
      })
    });
    if (!response.ok) throw new Error('Ошибка отправки почты');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail.trim() || !authPass.trim()) return setAuthError('Заполните все поля');

    const safeEmail = authEmail.trim().replace(/\./g, ','); 

    if (authMode === 'register') {
      if (!authName.trim()) return setAuthError('Введите имя / позывной');
      
      setIsSendingMail(true);
      try {
        const snapshot = await get(ref(db, 'users/' + safeEmail));
        if (snapshot.exists()) {
          setAuthError('Пользователь с такой почтой уже существует');
          setIsSendingMail(false);
          return;
        }

        const code = generateSixDigitCode();
        await sendEmailViaEmailJS(authEmail.trim(), authName.trim(), code);
        setPendingUser({ email: authEmail.trim(), pass: authPass.trim(), name: authName.trim(), code });
        setAuthStep('verify');
      } catch (err) {
        setAuthError('Не удалось отправить письмо. Проверьте настройки EmailJS.');
      } finally {
        setIsSendingMail(false);
      }
    } else {
      setIsSendingMail(true);
      try {
        const snapshot = await get(ref(db, 'users/' + safeEmail));
        if (snapshot.exists() && snapshot.val().pass === authPass.trim()) {
          const loggedUser = snapshot.val();
          setCurrentUser(loggedUser);
          localStorage.setItem('tvzone_auth_user', JSON.stringify(loggedUser));
        } else if (authEmail.trim() === 'admin@tvzone.kz' && authPass.trim() === 'admin123') {
          const adminUser = { email: authEmail.trim(), name: 'Корпоративный мастер' };
          setCurrentUser(adminUser);
          localStorage.setItem('tvzone_auth_user', JSON.stringify(adminUser));
        } else {
          setAuthError('Неверная почта или пароль');
        }
      } catch (err) {
        setAuthError('Ошибка подключения к базе данных');
      } finally {
        setIsSendingMail(false);
      }
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (verificationInput.trim() !== pendingUser.code) {
      return setAuthError('Неверный 6-значный код');
    }

    const newUser = { email: pendingUser.email, pass: pendingUser.pass, name: pendingUser.name };
    const safeEmail = pendingUser.email.replace(/\./g, ',');
    
    await set(ref(db, 'users/' + safeEmail), newUser);

    setCurrentUser(newUser);
    localStorage.setItem('tvzone_auth_user', JSON.stringify(newUser));
    setPendingUser(null);
    setVerificationInput('');
    setAuthStep('form');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tvzone_auth_user');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      normalizeImageOrientation(file, (dataUrl) => {
        setUploadedImage(dataUrl);
        setPaths([]);
      });
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setPaths([]);
    setIsFullscreenDraw(false);
  };

  const getCoordinates = (e, targetCanvas) => {
    const canvas = targetCanvas || canvasRef.current;
    if(!canvas) return {x:0, y:0};
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e, isFs = false) => {
    e.preventDefault();
    setIsDrawing(true);
    const activeCanvas = isFs ? fsCanvasRef.current : canvasRef.current;
    setCurrentPath({ tool, color, size: brushSize, points: [getCoordinates(e, activeCanvas)] });
  };

  const draw = (e, isFs = false) => {
    e.preventDefault();
    if (!isDrawing || !currentPath) return;
    const activeCanvas = isFs ? fsCanvasRef.current : canvasRef.current;
    setCurrentPath(prev => ({ ...prev, points: [...prev.points, getCoordinates(e, activeCanvas)] }));
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath) {
      setPaths([...paths, currentPath]);
      setCurrentPath(null);
      setIsDrawing(false);
    }
  };

  const renderCanvasPaths = (targetCanvas) => {
    if (!targetCanvas) return;
    const ctx = targetCanvas.getContext('2d');
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    
    const drawPath = (path) => {
      ctx.beginPath();
      ctx.strokeStyle = path.tool === 'eraser' ? '#000' : path.color;
      ctx.lineWidth = path.tool === 'eraser' ? path.size * 5 : path.size; 
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = path.tool === 'eraser' ? 'destination-out' : 'source-over';
      path.points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    };

    paths.forEach(drawPath);
    if (currentPath) drawPath(currentPath);
    ctx.globalCompositeOperation = 'source-over';
  };

  useEffect(() => {
    renderCanvasPaths(canvasRef.current);
    if (isFullscreenDraw) renderCanvasPaths(fsCanvasRef.current);
  }, [paths, currentPath, isFullscreenDraw]);

  const handleImageLoad = (e) => {
    if (canvasRef.current) {
      canvasRef.current.width = e.target.naturalWidth || e.target.width;
      canvasRef.current.height = e.target.naturalHeight || e.target.height;
    }
  };

  const handleFsImageLoad = (e) => {
    if (fsCanvasRef.current) {
      fsCanvasRef.current.width = e.target.naturalWidth || e.target.width;
      fsCanvasRef.current.height = e.target.naturalHeight || e.target.height;
      renderCanvasPaths(fsCanvasRef.current);
    }
  };

  const handleSave = async () => {
    if (!uploadedImage) return;
    const canvas = canvasRef.current;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width || 1280;
    finalCanvas.height = canvas.height || 720;
    const finalCtx = finalCanvas.getContext('2d');
    
    const img = new Image();
    img.src = uploadedImage;
    img.onload = async () => {
      finalCanvas.width = img.naturalWidth || finalCanvas.width;
      finalCanvas.height = img.naturalHeight || finalCanvas.height;
      finalCtx.drawImage(img, 0, 0);
      finalCtx.drawImage(canvas, 0, 0);
      
      const now = new Date();
      const timeString = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const newId = Date.now();
      const newRecord = {
        id: newId,
        drawnImage: finalCanvas.toDataURL('image/jpeg', 0.8),
        address: clientAddress,
        comment: comment,
        author: currentUser?.name || 'Мастер',
        time: timeString
      };

      try {
        await set(ref(db, 'projects/' + newId), newRecord);
        setActivePage('history');
        setUploadedImage(null); setClientAddress(''); setComment(''); setPaths([]);
      } catch (err) {
        console.error(err);
        alert('Ошибка при сохранении в облако. Проверьте настройки базы данных Firebase.');
      }
    };
  };

  const shareToWhatsApp = async (record) => {
    const textMessage = `🛠 *Новый замер: TVZONE*\n\n📍 *Адрес:* ${record.address || 'Не указан'}\n👷 *Мастер:* ${record.author}\n🕒 *Время:* ${record.time}\n\n💬 *Детали проекта:*\n${record.comment || 'Нет комментариев'}`;
    try {
      const response = await fetch(record.drawnImage);
      const blob = await response.blob();
      const safeTimeName = record.time.replace(/[: ]/g, '_');
      const file = new File([blob], `Zamer_${safeTimeName}.jpg`, { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ text: textMessage, files: [file] });
      } else {
        const a = document.createElement('a');
        a.href = record.drawnImage;
        a.download = `Zamer_${safeTimeName}.jpg`;
        a.click();
        window.open(`https://wa.me/?text=${encodeURIComponent(textMessage)}`, '_blank');
      }
    } catch (error) {
      console.log('Отправка отменена', error);
    }
  };

  const openDetail = (record) => { setSelectedRecord(record); setActivePage('detail'); };
  const closeDetail = () => { setSelectedRecord(null); setActivePage('history'); };

  const renderToolbar = (isFs = false) => (
    <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-3xl border border-white/10 px-3 sm:px-5 py-2.5 rounded-2xl shadow-2xl shrink-0 ${isFs ? 'mt-3' : 'mt-2.5'}`}>
      <button onClick={() => setTool('pen')} className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${tool === 'pen' ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
        <PenTool size={16} strokeWidth={1.5} />
      </button>
      <button onClick={() => setTool('eraser')} className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${tool === 'eraser' ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
        <Eraser size={16} strokeWidth={1.5} />
      </button>
      <div className="w-px h-5 bg-white/15 mx-0.5"></div>
      <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white/30 overflow-hidden relative shadow-inner">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute -top-3 -left-3 w-14 h-14 cursor-pointer" />
        </div>
      </div>
      <div className="w-px h-5 bg-white/15 mx-0.5"></div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button onClick={() => setBrushSize(2)} className={`rounded-full transition-all duration-300 ${brushSize === 2 ? 'bg-white scale-125 shadow-[0_0_8px_white]' : 'bg-white/30 hover:bg-white/60'} w-1.5 h-1.5`} />
        <button onClick={() => setBrushSize(4)} className={`rounded-full transition-all duration-300 ${brushSize === 4 ? 'bg-white scale-125 shadow-[0_0_8px_white]' : 'bg-white/30 hover:bg-white/60'} w-2.5 h-2.5`} />
        <button onClick={() => setBrushSize(8)} className={`rounded-full transition-all duration-300 ${brushSize === 8 ? 'bg-white scale-125 shadow-[0_0_8px_white]' : 'bg-white/30 hover:bg-white/60'} w-3.5 h-3.5`} />
        <button onClick={() => setBrushSize(14)} className={`rounded-full transition-all duration-300 ${brushSize === 14 ? 'bg-white scale-125 shadow-[0_0_8px_white]' : 'bg-white/30 hover:bg-white/60'} w-4.5 h-4.5`} />
        <button onClick={() => setBrushSize(22)} className={`rounded-full transition-all duration-300 ${brushSize === 22 ? 'bg-white scale-125 shadow-[0_0_8px_white]' : 'bg-white/30 hover:bg-white/60'} w-6 h-6`} />
        <button onClick={() => setBrushSize(32)} className={`rounded-full transition-all duration-300 ${brushSize === 32 ? 'bg-white scale-125 shadow-[0_0_8px_white]' : 'bg-white/30 hover:bg-white/60'} w-7.5 h-7.5`} />
      </div>
      <div className="w-px h-5 bg-white/15 mx-0.5"></div>
      <button onClick={() => setPaths(paths.slice(0, -1))} className="p-2 sm:p-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors">
        <Undo size={16} strokeWidth={1.5} />
      </button>
      <button onClick={() => setPaths([])} className="p-2 sm:p-2.5 rounded-xl text-red-400/80 hover:bg-red-500/20 hover:text-red-400 transition-colors">
        <Trash2 size={16} strokeWidth={1.5} />
      </button>
    </div>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen animate-pulse duration-[4000ms]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse duration-[5000ms]"></div>
        
        <div className="fixed top-6 right-6 z-50 flex gap-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-lg">
          {['ru', 'kz', 'en'].map(l => (
            <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all duration-300 ${lang === l ? 'bg-white/20 text-white font-medium' : 'text-white/40 hover:text-white/80'}`}>
              {l}
            </button>
          ))}
        </div>

        <SpatialWindow className="w-full max-w-md p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-700 relative z-10">
          {authStep === 'form' ? (
            <>
              <div className="text-center mb-6 sm:mb-8">
                <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-white/80 mx-auto mb-3 sm:mb-4 opacity-80" strokeWidth={1} />
                <h1 className="text-xl sm:text-2xl font-medium tracking-wide text-white mb-1">{t.sys_name}</h1>
                <p className="text-white/40 text-[10px] sm:text-xs tracking-widest uppercase">{t.auth_title}</p>
              </div>

              <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/5">
                <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all ${authMode === 'login' ? 'bg-white/20 text-white font-medium' : 'text-white/40 hover:text-white'}`}>{t.auth_tab_login}</button>
                <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }} className={`flex-1 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all ${authMode === 'register' ? 'bg-white/20 text-white font-medium' : 'text-white/40 hover:text-white'}`}>{t.auth_tab_reg}</button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder={t.auth_name} className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-3.5 pl-11 pr-5 text-white outline-none focus:bg-white/[0.1] transition-all placeholder:text-white/30 font-light text-sm" />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder={t.auth_email} className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-3.5 pl-11 pr-5 text-white outline-none focus:bg-white/[0.1] transition-all placeholder:text-white/30 font-light text-sm" />
                </div>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} placeholder={t.auth_pass} className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-3.5 pl-11 pr-5 text-white outline-none focus:bg-white/[0.1] transition-all placeholder:text-white/30 font-light text-sm" />
                </div>

                {authError && <p className="text-red-400 text-xs text-center font-light">{authError}</p>}

                <button type="submit" disabled={isSendingMail} className="w-full bg-white text-black rounded-2xl py-3.5 font-medium hover:scale-[1.02] transition-transform duration-300 mt-4 shadow-[0_0_20px_rgba(255,255,255,0.2)] text-sm flex items-center justify-center gap-2">
                  {isSendingMail && <Loader2 size={16} className="animate-spin" />}
                  {authMode === 'register' ? t.auth_btn_reg : t.auth_btn_login}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <ShieldCheck className="w-12 h-12 text-[#25D366] mx-auto mb-4 opacity-90" strokeWidth={1} />
                <h2 className="text-xl font-medium tracking-wide text-white mb-2">{t.auth_verify_title}</h2>
                <p className="text-white/50 text-xs font-light leading-relaxed">{t.auth_verify_desc}</p>
                <p className="text-xs text-white/30 mt-1 font-mono">{pendingUser?.email}</p>
              </div>

              <input type="text" maxLength={6} value={verificationInput} onChange={e => setVerificationInput(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="w-full bg-white/[0.05] border border-white/20 rounded-2xl py-4 text-white text-center text-2xl font-mono tracking-[0.5em] outline-none focus:bg-white/[0.1] transition-all" />

              {authError && <p className="text-red-400 text-xs font-light">{authError}</p>}

              <button type="submit" className="w-full bg-white text-black rounded-2xl py-4 font-medium hover:scale-[1.02] transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] text-sm">
                {t.auth_verify_btn}
              </button>

              <button type="button" onClick={() => setAuthStep('form')} className="text-xs text-white/40 hover:text-white transition-colors">
                ← Назад к форме регистрации
              </button>
            </form>
          )}
        </SpatialWindow>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-x-hidden">
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>

      {activePage !== 'detail' && (
        <header className="fixed top-3 sm:top-5 left-2 sm:left-6 right-2 sm:right-6 z-40 flex justify-between items-center pointer-events-none gap-1 sm:gap-2 animate-in fade-in duration-500">
          <div className="pointer-events-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full p-2.5 sm:px-5 sm:py-2 flex items-center gap-2.5 shadow-lg shrink-0">
            <Eye size={16} className="text-white/70" />
            <span className="hidden sm:block text-xs sm:text-sm tracking-widest font-light truncate max-w-[100px] sm:max-w-none">{currentUser.name}</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 bg-white/5 backdrop-blur-2xl border border-white/10 p-1 rounded-full shadow-lg shrink-0">
            <button onClick={() => setActivePage('new')} className={`flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2 rounded-full transition-all duration-300 ${activePage === 'new' ? 'bg-white text-black shadow-md scale-105' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Plus size={16} strokeWidth={activePage === 'new' ? 2 : 1.5} />
              <span className="hidden md:block text-xs sm:text-sm tracking-wide font-medium">{t.nav_new}</span>
            </button>
            <button onClick={() => setActivePage('history')} className={`flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2 rounded-full transition-all duration-300 ${activePage === 'history' ? 'bg-white text-black shadow-md scale-105' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Grid size={16} strokeWidth={activePage === 'history' ? 2 : 1.5} />
              <span className="hidden md:block text-xs sm:text-sm tracking-wide font-medium">{t.nav_history}</span>
            </button>
          </div>

          <div className="pointer-events-auto flex gap-1 sm:gap-2 items-center shrink-0">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full p-1 flex gap-1 shadow-lg">
              {['ru', 'kz', 'en'].map(l => (
                <button key={l} onClick={() => setLang(l)} className={`px-2 py-1.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] uppercase tracking-wider transition-all duration-300 ${lang === l ? 'bg-white/20 text-white font-medium' : 'text-white/40 hover:text-white/80'}`}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={handleLogout} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-lg shrink-0">
              <LogOut size={15} />
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 ${activePage === 'detail' ? 'pt-8' : 'pt-20 sm:pt-24'} pb-8 px-3 sm:px-6 max-w-7xl mx-auto w-full relative z-10 flex flex-col`}>
        {activePage === 'new' && (
          <div className="animate-in fade-in duration-500 flex-1 flex flex-col">
            {!uploadedImage ? (
              <SpatialWindow className="flex-1 min-h-[50vh] flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-xl">
                  <label className="flex-1 flex flex-col items-center justify-center p-8 sm:p-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[24px] cursor-pointer transition-all group shadow-inner">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500"><Camera size={28} className="text-white/70 group-hover:text-white transition-colors" strokeWidth={1.5} /></div>
                    <span className="text-xs sm:text-sm font-light tracking-widest uppercase text-white/70 group-hover:text-white transition-colors">{t.btn_camera}</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <label className="flex-1 flex flex-col items-center justify-center p-8 sm:p-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[24px] cursor-pointer transition-all group shadow-inner">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500"><ImageIcon size={28} className="text-white/70 group-hover:text-white transition-colors" strokeWidth={1.5} /></div>
                    <span className="text-xs sm:text-sm font-light tracking-widest uppercase text-white/70 group-hover:text-white transition-colors">{t.btn_gallery}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </SpatialWindow>
            ) : (
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-stretch flex-1">
                <SpatialWindow className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 bg-black/25 relative overflow-hidden">
                  <div className="w-full flex justify-between items-center mb-3 shrink-0">
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/40">Разметка зоны</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsFullscreenDraw(true)} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center gap-1.5 text-white/80 hover:text-white transition-all text-[11px] sm:text-xs tracking-wider">
                        <Maximize2 size={13} /> На весь экран
                      </button>
                      <button onClick={clearImage} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-300">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center justify-center max-w-full max-h-[45vh] lg:max-h-[55vh] overflow-hidden my-auto">
                    <img ref={imageRef} src={uploadedImage} alt="Основа" className="block max-w-full h-auto max-h-[45vh] lg:max-h-[55vh] rounded-2xl opacity-90 object-contain mx-auto" onLoad={handleImageLoad} />
                    <canvas ref={canvasRef} onMouseDown={(e) => startDrawing(e, false)} onMouseMove={(e) => draw(e, false)} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={(e) => startDrawing(e, false)} onTouchMove={(e) => draw(e, false)} onTouchEnd={stopDrawing} className="absolute top-0 left-0 w-full h-full z-10 cursor-crosshair touch-none" />
                  </div>
                  {renderToolbar(false)}
                </SpatialWindow>
                <SpatialWindow className="w-full lg:w-80 xl:w-96 p-5 sm:p-7 flex flex-col gap-5 shrink-0">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest">{t.form_address}</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                      <input value={clientAddress} onChange={e=>setClientAddress(e.target.value)} type="text" placeholder="Локация..." className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-3 text-white outline-none focus:bg-white/10 transition-all text-xs sm:text-sm font-light" />
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest">{t.form_comment}</label>
                    <div className="relative flex-1 min-h-[90px] lg:min-h-[140px]">
                       <AlignLeft className="absolute left-3.5 top-3.5 text-white/30" size={15} />
                       <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Детали..." className="w-full h-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-3 text-white outline-none focus:bg-white/10 transition-all resize-none text-xs sm:text-sm font-light" />
                    </div>
                  </div>
                  <button onClick={handleSave} className="w-full bg-white text-black font-medium py-3.5 sm:py-4 rounded-xl hover:scale-[1.01] transition-transform duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] text-xs sm:text-sm shrink-0">
                    <Save size={16} /> {t.form_save}
                  </button>
                </SpatialWindow>
              </div>
            )}
          </div>
        )}

        {isFullscreenDraw && uploadedImage && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-300 select-none overflow-hidden">
            <div className="w-full max-w-6xl flex justify-between items-center shrink-0">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/40 bg-black/60 px-3 py-1.5 rounded-full border border-white/10">Полноэкранная разметка</span>
              <button onClick={() => setIsFullscreenDraw(false)} className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white text-xs transition-all">✕ Свернуть</button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl max-h-[68vh] overflow-hidden my-auto py-2">
              <div className="relative inline-flex items-center justify-center max-w-full max-h-[68vh]">
                <img ref={fsImageRef} src={uploadedImage} alt="Во весь экран" className="block max-w-full h-auto max-h-[68vh] rounded-2xl opacity-90 object-contain mx-auto" onLoad={handleFsImageLoad} />
                <canvas ref={fsCanvasRef} onMouseDown={(e) => startDrawing(e, true)} onMouseMove={(e) => draw(e, true)} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={(e) => startDrawing(e, true)} onTouchMove={(e) => draw(e, true)} onTouchEnd={stopDrawing} className="absolute top-0 left-0 w-full h-full z-10 cursor-crosshair touch-none" />
              </div>
            </div>
            <div className="w-full max-w-3xl flex flex-wrap items-center justify-center gap-2 sm:gap-3 shrink-0">
              {renderToolbar(true)}
              <button onClick={() => setIsFullscreenDraw(false)} className="px-6 py-3 rounded-2xl bg-[#25D366] text-black font-semibold flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,211,102,0.4)] text-xs sm:text-sm">
                <Check size={18} /> {t.btn_done_fullscreen}
              </button>
            </div>
          </div>
        )}

        {activePage === 'history' && (
          <div className="animate-in fade-in duration-500">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-24 sm:mt-32">
                <Grid size={42} className="text-white/20 mb-3" strokeWidth={1} />
                <p className="text-xs sm:text-sm font-light tracking-widest uppercase text-white/30">{t.hist_empty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {history.map(item => (
                  <SpatialWindow key={item.id} className="cursor-pointer group hover:bg-white/[0.08] transition-colors duration-500 overflow-hidden flex flex-col">
                    <div onClick={() => openDetail(item)} className="flex-1 flex flex-col">
                      <div className="aspect-video bg-black/55 relative overflow-hidden">
                        <img src={item.drawnImage} alt="Замер" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-2.5 left-3.5 flex items-center gap-1.5 text-white/90">
                          <Clock size={13} className="text-white/50" />
                          <span className="text-[11px] font-mono tracking-wider">{item.time}</span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Мастер</p>
                          <div className="flex items-center gap-1.5">
                            <User size={13} className="text-white/70" />
                            <span className="text-xs sm:text-sm font-medium tracking-wide truncate">{item.author}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Объект</p>
                          <div className="flex items-start gap-1.5">
                            <MapPin size={13} className="text-white/70 shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm font-light leading-snug line-clamp-2 text-white/80">{item.address || 'Адрес не указан'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SpatialWindow>
                ))}
              </div>
            )}
          </div>
        )}

        {activePage === 'detail' && selectedRecord && (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <button onClick={closeDetail} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all text-xs sm:text-sm tracking-wide">
                <ChevronLeft size={16} /> {t.btn_back}
              </button>
              <h2 className="text-xs sm:text-sm font-light tracking-widest uppercase text-white/70 hidden md:block">{t.detail_title}</h2>
              <div className="flex gap-2.5">
                <a href={selectedRecord.drawnImage} download={`Замер_${selectedRecord.time.replace(/[: ]/g, '_')}.jpg`} className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all text-xs sm:text-sm font-medium">
                  <Download size={15} /> <span className="hidden sm:inline">{t.btn_download}</span>
                </a>
                <button onClick={() => shareToWhatsApp(selectedRecord)} className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full bg-[#25D366] text-black hover:scale-105 transition-all text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(37,211,102,0.3)]">
                  <MessageCircle size={15} /> {t.btn_whatsapp}
                </button>
              </div>
            </div>

            <SpatialWindow className="p-5 sm:p-8 flex flex-col xl:flex-row gap-6 lg:gap-10">
              <div className="w-full xl:w-2/3 bg-black/40 rounded-[20px] overflow-hidden flex items-center justify-center p-2 border border-white/5 shadow-inner">
                <img src={selectedRecord.drawnImage} alt="Чертеж" className="max-w-full h-auto max-h-[60vh] object-contain rounded-xl" />
              </div>
              <div className="w-full xl:w-1/3 space-y-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="bg-white/[0.03] p-4 sm:p-5 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mb-3">Информация о мастере</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><User size={18} /></div>
                      <div>
                        <p className="text-[11px] text-white/50">Ответственный</p>
                        <p className="font-medium text-sm sm:text-base tracking-wide">{selectedRecord.author}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 bg-white/[0.03] p-4 sm:p-5 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2">Время фиксации</p>
                      <div className="flex items-center gap-2.5">
                        <Clock size={15} className="text-white/50" />
                        <span className="font-mono text-xs sm:text-sm text-white/90">{selectedRecord.time}</span>
                      </div>
                    </div>
                    <div className="w-full h-px bg-white/5"></div>
                    <div>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2">Локация</p>
                      <div className="flex items-start gap-2.5">
                        <MapPin size={15} className="text-white/50 shrink-0 mt-0.5" />
                        <span className="font-light leading-relaxed text-xs sm:text-sm text-white/90">{selectedRecord.address || 'Объект без адреса'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {selectedRecord.comment && (
                  <div className="bg-white/[0.03] p-4 sm:p-5 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mb-3">{t.form_comment}</p>
                    <div className="flex items-start gap-2.5">
                      <AlignLeft size={15} className="text-white/50 shrink-0 mt-0.5" />
                      <p className="font-light text-white/70 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">{selectedRecord.comment}</p>
                    </div>
                  </div>
                )}
              </div>
            </SpatialWindow>
          </div>
        )}
      </main>
    </div>
  );
}