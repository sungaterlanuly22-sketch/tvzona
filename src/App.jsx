import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Save, Undo, Eraser, Trash2, 
  PenTool, User, MapPin, LogOut, Download, 
  Grid, Plus, ChevronLeft, Clock, AlignLeft, Eye, MessageCircle, Image as ImageIcon, Upload, Database, Lock, Mail, Key, ShieldCheck
} from 'lucide-react';

const translations = {
  ru: {
    sys_name: "TVZONE", sys_sub: "Spatial Workspace",
    auth_title: "Авторизация доступа", auth_tab_login: "Вход", auth_tab_reg: "Регистрация",
    auth_email: "Корпоративная почта", auth_pass: "Пароль", auth_name: "Имя / Позывной мастера",
    auth_btn_login: "Войти в систему", auth_btn_reg: "Получить код на почту",
    auth_verify_title: "Подтверждение почты", auth_verify_desc: "Введите 6-значный код, отправленный на вашу почту",
    auth_verify_btn: "Подтвердить и завершить", auth_resend: "Отправить код повторно",
    nav_new: "Новый замер", nav_history: "База проектов",
    form_address: "Адрес объекта", form_comment: "Технические детали", form_save: "Сохранить проект",
    hist_author: "Ответственный:", hist_empty: "Пространство проектов пусто", detail_title: "Карточка проекта",
    btn_download: "Сохранить", btn_whatsapp: "В WhatsApp", btn_back: "Назад к списку",
    btn_camera: "Сделать фото", btn_gallery: "Из галереи",
    sync_export: "Экспорт базы", sync_import: "Импорт базы"
  },
  kz: {
    sys_name: "TVZONE", sys_sub: "Spatial Workspace",
    auth_title: "Қолжетімділік автосаудасы", auth_tab_login: "Кіру", auth_tab_reg: "Тіркелу",
    auth_email: "Корпоративтік пошта", auth_pass: "Құпия сөз", auth_name: "Аты / Шебер аты",
    auth_btn_login: "Жүйеге кіру", auth_btn_reg: "Поштаға код алу",
    auth_verify_title: "Поштаны растау", auth_verify_desc: "Поштаңызға жіберілген 6 таңбалы кодты енгізіңіз",
    auth_verify_btn: "Растау және аяқтау", auth_resend: "Кодты қайта жіберу",
    nav_new: "Жаңа өлшем", nav_history: "Жобалар базасы",
    form_address: "Нысан мекенжайы", form_comment: "Техникалық бөлшектер", form_save: "Жобаны сақтау",
    hist_author: "Жауапты:", hist_empty: "Жобалар кеңістігі бос", detail_title: "Жоба картасы",
    btn_download: "Сақтау", btn_whatsapp: "WhatsApp-қа", btn_back: "Тізімге қайту",
    btn_camera: "Суретке түсіру", btn_gallery: "Галереядан",
    sync_export: "Базаны экспорттау", sync_import: "Базаны импорттау"
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
    btn_camera: "Take Photo", btn_gallery: "From Gallery",
    sync_export: "Export DB", sync_import: "Import DB"
  }
};

const SpatialWindow = ({ children, className = '' }) => (
  <div className={`bg-white/[0.04] backdrop-blur-[40px] border border-white/[0.08] shadow-[0_30px_80px_rgba(0,0,0,0.6)] rounded-[32px] ${className}`}>
    {children}
  </div>
);

// IndexedDB утилита
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TVZonePersistentDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

const getProjectsFromIDB = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('projects', 'readonly');
      const store = tx.objectStore('projects');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.id - a.id));
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
};

const saveProjectToIDB = async (project) => {
  try {
    const db = await initDB();
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    store.put(project);
  } catch (e) {
    console.error('IDB save error', e);
  }
};

export default function App() {
  const [lang, setLang] = useState('ru');
  const t = translations[lang];
  
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tvzone_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authStep, setAuthStep] = useState('form'); // 'form' | 'verify'
  
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Данные для верификации кода
  const [pendingUser, setPendingUser] = useState(null);
  const [verificationInput, setVerificationInput] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState('');

  const [activePage, setActivePage] = useState('new'); 
  const [uploadedImage, setUploadedImage] = useState(null);
  const [clientAddress, setClientAddress] = useState('');
  const [comment, setComment] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null); 

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FFFFFF');
  const [tool, setTool] = useState('pen'); 
  const [brushSize, setBrushSize] = useState(4);
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);

  useEffect(() => {
    if (currentUser) {
      getProjectsFromIDB().then(data => setHistory(data));
    }
  }, [currentUser]);

  // Генерация 6-значного кода
  const generateSixDigitCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail.trim() || !authPass.trim()) {
      setAuthError('Заполните все поля');
      return;
    }

    const usersStore = JSON.parse(localStorage.getItem('tvzone_users_db') || '[]');

    if (authMode === 'register') {
      if (!authName.trim()) {
        setAuthError('Введите имя / позывной');
        return;
      }
      const existing = usersStore.find(u => u.email === authEmail.trim());
      if (existing) {
        setAuthError('Пользователь с такой почтой уже существует');
        return;
      }

      // Генерация 6-значного кода подтверждения
      const code = generateSixDigitCode();
      const pendingData = { email: authEmail.trim(), pass: authPass.trim(), name: authName.trim(), code };
      setPendingUser(pendingData);
      setDemoCodeHint(code); // Подсказка для проверки (симуляция письма на почту)
      setAuthStep('verify');
    } else {
      // Login check
      const found = usersStore.find(u => u.email === authEmail.trim() && u.pass === authPass.trim());
      if (!found && !(authEmail.trim() === 'admin@tvzone.kz' && authPass.trim() === 'admin123')) {
        setAuthError('Неверная почта или пароль');
        return;
      }
      const loggedUser = found || { email: authEmail.trim(), name: 'Корпоративный мастер' };
      setCurrentUser(loggedUser);
      localStorage.setItem('tvzone_auth_user', JSON.stringify(loggedUser));
    }
  };

  // Проверка 6-значного кода при регистрации
  const handleVerifyCode = (e) => {
    e.preventDefault();
    setAuthError('');
    if (verificationInput.trim() !== pendingUser.code) {
      setAuthError('Неверный 6-значный код подтверждения');
      return;
    }

    const usersStore = JSON.parse(localStorage.getItem('tvzone_users_db') || '[]');
    const newUser = { email: pendingUser.email, pass: pendingUser.pass, name: pendingUser.name };
    usersStore.push(newUser);
    localStorage.setItem('tvzone_users_db', JSON.stringify(usersStore));

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
      const reader = new FileReader();
      reader.onload = (event) => setUploadedImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if(!canvas) return {x:0, y:0};
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    setCurrentPath({ tool, color, size: brushSize, points: [getCoordinates(e)] });
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || !currentPath) return;
    setCurrentPath(prev => ({ ...prev, points: [...prev.points, getCoordinates(e)] }));
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath) {
      setPaths([...paths, currentPath]);
      setCurrentPath(null);
      setIsDrawing(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
  }, [paths, currentPath]);

  const handleImageLoad = (e) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = e.target.naturalWidth;
      canvas.height = e.target.naturalHeight;
    }
  };

  const handleSave = () => {
    if (!uploadedImage) return;
    const canvas = canvasRef.current;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const finalCtx = finalCanvas.getContext('2d');
    
    const img = new Image();
    img.src = uploadedImage;
    img.onload = () => {
      finalCtx.drawImage(img, 0, 0);
      finalCtx.drawImage(canvas, 0, 0);
      
      const now = new Date();
      const timeString = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const newRecord = {
        id: Date.now(),
        drawnImage: finalCanvas.toDataURL('image/png'),
        address: clientAddress,
        comment: comment,
        author: currentUser?.name || 'Мастер',
        time: timeString
      };

      saveProjectToIDB(newRecord);
      setHistory(prev => [newRecord, ...prev]);
      setActivePage('history');
      setUploadedImage(null); setClientAddress(''); setComment(''); setPaths([]);
    };
  };

  const exportDatabase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tvzone_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDatabase = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          setHistory(imported);
          for (const item of imported) {
            await saveProjectToIDB(item);
          }
          alert('База успешно импортирована в IndexedDB!');
        }
      } catch (err) {
        alert('Ошибка чтения файла базы данных.');
      }
    };
    reader.readAsText(file);
  };

  const shareToWhatsApp = async (record) => {
    const textMessage = `🛠 *Новый замер: TVZONE*\n\n📍 *Адрес:* ${record.address || 'Не указан'}\n👷 *Мастер:* ${record.author}\n🕒 *Время:* ${record.time}\n\n💬 *Детали проекта:*\n${record.comment || 'Нет комментариев'}`;
    
    try {
      const response = await fetch(record.drawnImage);
      const blob = await response.blob();
      const safeTimeName = record.time.replace(/[: ]/g, '_');
      const file = new File([blob], `Zamer_${safeTimeName}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: textMessage,
          files: [file]
        });
      } else {
        const a = document.createElement('a');
        a.href = record.drawnImage;
        a.download = `Zamer_${safeTimeName}.png`;
        a.click();

        const waLink = `https://wa.me/?text=${encodeURIComponent(textMessage)}`;
        window.open(waLink, '_blank');
      }
    } catch (error) {
      console.log('Отправка отменена', error);
    }
  };

  const openDetail = (record) => {
    setSelectedRecord(record);
    setActivePage('detail');
  };

  const closeDetail = () => {
    setSelectedRecord(null);
    setActivePage('history');
  };

  // ЭКРАН СТРОГОЙ АВТОРИЗАЦИИ / ВЕРИФИКАЦИИ КОДА
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen animate-pulse duration-[4000ms]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse duration-[5000ms]"></div>
        
        <div className="fixed top-6 right-6 z-50 flex gap-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-lg">
          {['ru', 'kz', 'en'].map(l => (
            <button 
              key={l} onClick={() => setLang(l)} 
              className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all duration-300 ${lang === l ? 'bg-white/20 text-white font-medium' : 'text-white/40 hover:text-white/80'}`}
            >
              {l}
            </button>
          ))}
        </div>

        <SpatialWindow className="w-full max-w-md p-10 animate-in fade-in zoom-in-95 duration-700 relative z-10">
          {authStep === 'form' ? (
            <>
              <div className="text-center mb-8">
                <Lock className="w-12 h-12 text-white/80 mx-auto mb-4 opacity-80" strokeWidth={1} />
                <h1 className="text-2xl font-medium tracking-wide text-white mb-1">{t.sys_name}</h1>
                <p className="text-white/40 text-xs tracking-widest uppercase">{t.auth_title}</p>
              </div>

              <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/5">
                <button 
                  type="button" 
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all ${authMode === 'login' ? 'bg-white/20 text-white font-medium' : 'text-white/40 hover:text-white'}`}
                >
                  {t.auth_tab_login}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all ${authMode === 'register' ? 'bg-white/20 text-white font-medium' : 'text-white/40 hover:text-white'}`}
                >
                  {t.auth_tab_reg}
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input 
                      type="text" 
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      placeholder={t.auth_name} 
                      className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-4 pl-11 pr-5 text-white outline-none focus:bg-white/[0.1] transition-all placeholder:text-white/30 font-light text-sm" 
                    />
                  </div>
                )}
                
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input 
                    type="email" 
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder={t.auth_email} 
                    className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-4 pl-11 pr-5 text-white outline-none focus:bg-white/[0.1] transition-all placeholder:text-white/30 font-light text-sm" 
                  />
                </div>

                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input 
                    type="password" 
                    value={authPass}
                    onChange={e => setAuthPass(e.target.value)}
                    placeholder={t.auth_pass} 
                    className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-4 pl-11 pr-5 text-white outline-none focus:bg-white/[0.1] transition-all placeholder:text-white/30 font-light text-sm" 
                  />
                </div>

                {authError && (
                  <p className="text-red-400 text-xs text-center font-light">{authError}</p>
                )}

                <button type="submit" className="w-full bg-white text-black rounded-2xl py-4 font-medium hover:scale-[1.02] transition-transform duration-300 mt-4 shadow-[0_0_20px_rgba(255,255,255,0.2)] text-sm">
                  {authMode === 'register' ? t.auth_btn_reg : t.auth_btn_login}
                </button>
              </form>
              {authMode === 'login' && (
                <p className="text-center text-[11px] text-white/30 mt-4">Тестовый вход: admin@tvzone.kz / admin123</p>
              )}
            </>
          ) : (
            /* ЭКРАН ВВОДА 6-ЗНАЧНОГО КОДА ПОДТВЕРЖДЕНИЯ ПОЧТЫ */
            <form onSubmit={handleVerifyCode} className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <ShieldCheck className="w-12 h-12 text-[#25D366] mx-auto mb-4 opacity-90" strokeWidth={1} />
                <h2 className="text-xl font-medium tracking-wide text-white mb-2">{t.auth_verify_title}</h2>
                <p className="text-white/50 text-xs font-light leading-relaxed">{t.auth_verify_desc}</p>
                <p className="text-xs text-white/30 mt-1 font-mono">{pendingUser?.email}</p>
              </div>

              {/* Демо-подсказка кода для быстрой проверки на планшете */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-[11px] text-white/70 font-mono">
                📧 [Эмуляция почты]: Код подтверждения — <strong className="text-white text-sm">{demoCodeHint}</strong>
              </div>

              <input 
                type="text" 
                maxLength={6}
                value={verificationInput}
                onChange={e => setVerificationInput(e.target.value.replace(/\D/g, ''))}
                placeholder="000000" 
                className="w-full bg-white/[0.05] border border-white/20 rounded-2xl py-4 text-white text-center text-2xl font-mono tracking-[0.5em] outline-none focus:bg-white/[0.1] transition-all" 
              />

              {authError && (
                <p className="text-red-400 text-xs font-light">{authError}</p>
              )}

              <button type="submit" className="w-full bg-white text-black rounded-2xl py-4 font-medium hover:scale-[1.02] transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] text-sm">
                {t.auth_verify_btn}
              </button>

              <button 
                type="button" 
                onClick={() => setAuthStep('form')}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                ← Назад к форме регистрации
              </button>
            </form>
          )}
        </SpatialWindow>
      </div>
    );
  }

  // ОСНОВНОЙ ИНТЕРФЕЙС
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden">
      
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>

      {activePage !== 'detail' && (
        <header className="fixed top-6 left-6 right-6 z-40 flex justify-between items-center pointer-events-none animate-in fade-in duration-500">
          
          <div className="pointer-events-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-lg">
            <Eye size={18} className="text-white/70" />
            <span className="text-sm tracking-widest font-light hidden sm:inline-block">{currentUser.name}</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 bg-white/5 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full shadow-lg">
            <button 
              onClick={() => setActivePage('new')} 
              className={`flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full transition-all duration-300 ${activePage === 'new' ? 'bg-white text-black shadow-md scale-105' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <Plus size={16} strokeWidth={activePage === 'new' ? 2 : 1.5} />
              <span className="text-sm tracking-wide font-medium hidden sm:inline-block">{t.nav_new}</span>
            </button>
            <button 
              onClick={() => setActivePage('history')} 
              className={`flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full transition-all duration-300 ${activePage === 'history' ? 'bg-white text-black shadow-md scale-105' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <Grid size={16} strokeWidth={activePage === 'history' ? 2 : 1.5} />
              <span className="text-sm tracking-wide font-medium hidden sm:inline-block">{t.nav_history}</span>
            </button>
          </div>

          <div className="pointer-events-auto flex gap-3 sm:gap-4 items-center">
            <div className="hidden lg:flex items-center gap-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-lg">
              <button onClick={exportDatabase} className="px-3 py-1.5 text-xs text-white/60 hover:text-white flex items-center gap-1" title={t.sync_export}>
                <Database size={14} /> Экспорт
              </button>
              <label className="px-3 py-1.5 text-xs text-white/60 hover:text-white flex items-center gap-1 cursor-pointer" title={t.sync_import}>
                <Upload size={14} /> Импорт
                <input type="file" accept=".json" onChange={importDatabase} className="hidden" />
              </label>
            </div>

            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex gap-1 shadow-lg hidden md:flex">
              {['ru', 'kz', 'en'].map(l => (
                <button 
                  key={l} onClick={() => setLang(l)} 
                  className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all duration-300 ${lang === l ? 'bg-white/20 text-white font-medium' : 'text-white/40 hover:text-white/80'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button onClick={handleLogout} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full w-10 h-10 md:w-auto md:px-4 flex items-center justify-center gap-2 text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-lg">
              <LogOut size={16} />
              <span className="hidden md:inline text-xs font-medium uppercase tracking-widest">Выйти</span>
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 ${activePage === 'detail' ? 'pt-10' : 'pt-28'} pb-10 px-4 md:px-8 max-w-7xl mx-auto w-full relative z-10`}>
        
        {/* НОВЫЙ ПРОЕКТ */}
        {activePage === 'new' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {!uploadedImage ? (
              <SpatialWindow className="h-[70vh] flex flex-col items-center justify-center p-6">
                <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
                  <label className="flex-1 flex flex-col items-center justify-center p-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[32px] cursor-pointer transition-all group shadow-inner">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <Camera size={32} className="text-white/70 group-hover:text-white transition-colors" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-light tracking-widest uppercase text-white/70 group-hover:text-white transition-colors">{t.btn_camera}</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                  </label>

                  <label className="flex-1 flex flex-col items-center justify-center p-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[32px] cursor-pointer transition-all group shadow-inner">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <ImageIcon size={32} className="text-white/70 group-hover:text-white transition-colors" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-light tracking-widest uppercase text-white/70 group-hover:text-white transition-colors">{t.btn_gallery}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </SpatialWindow>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                <SpatialWindow className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/20 p-4 min-h-[50vh]">
                  <div className="relative inline-block max-w-full">
                    <img 
                      ref={imageRef}
                      src={uploadedImage} 
                      alt="Основа" 
                      className="block max-w-full h-auto max-h-[70vh] rounded-2xl opacity-90" 
                      onLoad={handleImageLoad} 
                    />
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                      className="absolute top-0 left-0 w-full h-full z-10 cursor-crosshair touch-none"
                    />
                  </div>
                  
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 bg-white/10 backdrop-blur-3xl border border-white/10 p-2 rounded-[30px] shadow-2xl">
                    <button onClick={() => setTool('pen')} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${tool === 'pen' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}>
                      <PenTool size={20} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setTool('eraser')} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${tool === 'eraser' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}>
                      <Eraser size={20} strokeWidth={1.5} />
                    </button>
                    
                    <div className="w-8 h-px bg-white/10 mx-auto my-1"></div>
                    
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden relative shadow-inner">
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer" />
                      </div>
                    </div>
                    
                    <div className="w-8 h-px bg-white/10 mx-auto my-1"></div>
                    
                    <div className="flex flex-col items-center justify-center gap-3 py-2 w-12">
                      <button onClick={() => setBrushSize(2)} className={`rounded-full transition-all duration-300 ${brushSize === 2 ? 'bg-white scale-125 shadow-[0_0_8px_white]' : 'bg-white/30 hover:bg-white/60'} w-2 h-2`} title="Тонкая" />
                      <button onClick={() => setBrushSize(4)} className={`rounded-full transition-all duration-300 ${brushSize === 4 ? 'bg-white scale-125 shadow-[0_0_8px_white]' : 'bg-white/30 hover:bg-white/60'} w-3 h-3`} title="Средняя" />
                      <button onClick={() => setBrushSize(8)} className={`rounded-full transition-all duration-300 ${brushSize === 8 ? 'bg-white scale-125 shadow-[0_0_8px_white]' : 'bg-white/30 hover:bg-white/60'} w-[18px] h-[18px]`} title="Толстая" />
                    </div>

                    <div className="w-8 h-px bg-white/10 mx-auto my-1"></div>

                    <button onClick={() => setPaths(paths.slice(0, -1))} className="w-12 h-12 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                      <Undo size={20} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setPaths([])} className="w-12 h-12 rounded-full flex items-center justify-center text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                      <Trash2 size={20} strokeWidth={1.5} />
                    </button>
                  </div>
                </SpatialWindow>

                <SpatialWindow className="w-full lg:w-96 p-8 flex flex-col gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest">{t.form_address}</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                      <input value={clientAddress} onChange={e=>setClientAddress(e.target.value)} type="text" placeholder="Локация..." className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white outline-none focus:bg-white/10 transition-all text-sm font-light" />
                    </div>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest">{t.form_comment}</label>
                    <div className="relative h-[150px] lg:h-[calc(100%-24px)]">
                       <AlignLeft className="absolute left-4 top-5 text-white/30" size={18} />
                       <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Детали..." className="w-full h-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white outline-none focus:bg-white/10 transition-all resize-none text-sm font-light" />
                    </div>
                  </div>

                  <button onClick={handleSave} className="w-full bg-white text-black font-medium py-5 rounded-2xl hover:scale-[1.02] transition-transform duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <Save size={18} /> {t.form_save}
                  </button>
                </SpatialWindow>
              </div>
            )}
          </div>
        )}

        {/* БАЗА ПРОЕКТОВ */}
        {activePage === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex lg:hidden justify-end gap-2 mb-6">
              <button onClick={exportDatabase} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-white/70">Экспорт базы</button>
              <label className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-white/70 cursor-pointer">
                Импорт базы
                <input type="file" accept=".json" onChange={importDatabase} className="hidden" />
              </label>
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-32">
                <Grid size={48} className="text-white/20 mb-4" strokeWidth={1} />
                <p className="text-sm font-light tracking-widest uppercase text-white/30">{t.hist_empty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map(item => (
                  <SpatialWindow 
                    key={item.id} 
                    className="cursor-pointer group hover:bg-white/[0.08] transition-colors duration-500 overflow-hidden flex flex-col"
                  >
                    <div onClick={() => openDetail(item)} className="flex-1 flex flex-col">
                      <div className="aspect-video bg-black/50 relative overflow-hidden">
                        <img src={item.drawnImage} alt="Замер" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white/90">
                          <Clock size={14} className="text-white/50" />
                          <span className="text-xs font-mono tracking-wider">{item.time}</span>
                        </div>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Мастер</p>
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-white/70" />
                            <span className="text-sm font-medium tracking-wide">{item.author}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Объект</p>
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-white/70 shrink-0 mt-0.5" />
                            <span className="text-sm font-light leading-snug line-clamp-2 text-white/80">{item.address || 'Адрес не указан'}</span>
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

        {/* КАРТОЧКА ПРОЕКТА */}
        {activePage === 'detail' && selectedRecord && (
          <div className="animate-in slide-in-from-right-12 fade-in duration-500">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <button onClick={closeDetail} className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all text-sm tracking-wide">
                <ChevronLeft size={18} /> {t.btn_back}
              </button>
              
              <h2 className="text-lg font-light tracking-widest uppercase text-white/70 hidden sm:block">{t.detail_title}</h2>
              
              <div className="flex gap-3">
                <a href={selectedRecord.drawnImage} download={`Замер_${selectedRecord.time.replace(/[: ]/g, '_')}.png`} className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all text-sm font-medium">
                  <Download size={18} /> <span className="hidden sm:inline">{t.btn_download}</span>
                </a>
                
                <button onClick={() => shareToWhatsApp(selectedRecord)} className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-black hover:scale-105 transition-all text-sm font-semibold shadow-[0_0_20px_rgba(37,211,102,0.3)]">
                  <MessageCircle size={18} /> {t.btn_whatsapp}
                </button>
              </div>
            </div>

            <SpatialWindow className="p-6 md:p-10 flex flex-col xl:flex-row gap-10 lg:gap-16">
              <div className="w-full xl:w-2/3 bg-black/40 rounded-[24px] overflow-hidden flex items-center justify-center p-2 border border-white/5 shadow-inner">
                <img src={selectedRecord.drawnImage} alt="Чертеж" className="max-w-full h-auto object-contain rounded-xl" />
              </div>

              <div className="w-full xl:w-1/3 space-y-10 flex flex-col">
                <div className="space-y-8">
                  <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-4">Информация о мастере</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><User size={20} /></div>
                      <div>
                        <p className="text-xs text-white/50 mb-1">{t.hist_author}</p>
                        <p className="font-medium text-lg tracking-wide">{selectedRecord.author}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Время фиксации</p>
                      <div className="flex items-center gap-3">
                        <Clock size={18} className="text-white/50" />
                        <span className="font-mono text-white/90">{selectedRecord.time}</span>
                      </div>
                    </div>
                    
                    <div className="w-full h-px bg-white/5"></div>
                    
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Локация</p>
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-white/50 shrink-0 mt-0.5" />
                        <span className="font-light leading-relaxed text-white/90">{selectedRecord.address || 'Объект без адреса'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedRecord.comment && (
                  <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex-1">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-4">{t.form_comment}</p>
                    <div className="flex items-start gap-3">
                      <AlignLeft size={18} className="text-white/50 shrink-0 mt-1" />
                      <p className="font-light text-white/70 leading-loose text-sm whitespace-pre-wrap">{selectedRecord.comment}</p>
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