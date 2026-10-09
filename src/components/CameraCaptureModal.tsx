import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Camera, RefreshCw, X, Check, Upload, AlertCircle, Laptop, Smartphone, Tablet } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  title?: string;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = 'Fotografar Ponto de Manutenção'
}: CameraCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, cameraFacing]);

  const startCamera = async (facingMode: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada diretamente neste navegador. Use a opção de envio de foto da galeria ou câmera nativa.');
      }

      let mediaStream: MediaStream;
      try {
        // Tenta com facingMode ideal (ideal para câmeras traseiras de celulares e tablets)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (constraintErr) {
        // Fallback automático para Webcams de Notebooks e PCs que não suportam a restrição 'facingMode'
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setStream(mediaStream);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
    } catch (err: any) {
      console.warn('Camera access failed, falling back:', err);
      setHasCameraPermission(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Permissão de câmera bloqueada pelo navegador. Toque abaixo para abrir a câmera nativa do aparelho ou selecione da galeria.'
          : 'Não foi possível iniciar a webcam/câmera ao vivo. Você pode tirar a foto diretamente pelo aplicativo de câmera do seu celular, tablet ou escolher um arquivo no notebook.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const compressed = await compressImage(rawDataUrl);
        setCapturedPhoto(compressed);
        stopCamera();
      }
    } catch (err) {
      console.warn('Erro ao capturar foto:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressed = await compressImage(file);
      setCapturedPhoto(compressed);
      stopCamera();
    } catch (err) {
      console.warn('Erro ao processar arquivo:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      handleClose();
    }
  };

  const retake = () => {
    setCapturedPhoto(null);
    startCamera(cameraFacing);
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPhoto(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div id="camera-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4">
      <div id="camera-modal-container" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header com identificação multi-aparelho */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">{title}</h3>
              <div className="flex items-center gap-2 text-[11px] text-emerald-300 font-medium mt-0.5">
                <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Celular</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1"><Tablet className="w-3 h-3" /> Tablet</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1"><Laptop className="w-3 h-3" /> Notebook</span>
              </div>
            </div>
          </div>
          <button 
            id="close-camera-btn"
            onClick={handleClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-slate-950 aspect-4/3 flex items-center justify-center overflow-hidden">
          {capturedPhoto ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img 
                src={capturedPhoto} 
                alt="Foto Capturada" 
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                <Check className="w-3.5 h-3.5" /> Foto capturada e otimizada
              </div>
            </div>
          ) : hasCameraPermission === false || cameraError ? (
            <div className="p-6 text-center text-slate-300 flex flex-col items-center gap-3">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <p className="text-sm font-medium text-amber-200">{cameraError}</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Toque em uma das opções abaixo para registrar a foto no seu aparelho:
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs mt-1">
                <button
                  id="camera-native-trigger-btn"
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Câmera do Aparelho
                </button>
                <button
                  id="camera-fallback-file-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Galeria / Arquivo
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center gap-2 text-white">
              <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
              <span className="text-xs font-semibold">Otimizando foto para qualquer dispositivo...</span>
            </div>
          )}

          {/* Input oculto com capture="environment" (dispara câmera nativa em celulares e tablets) */}
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Input oculto padrão para arquivos / galeria / notebook */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {capturedPhoto ? (
            <div className="flex items-center justify-between w-full gap-3">
              <button
                id="retake-photo-btn"
                type="button"
                onClick={retake}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Tirar Outra Foto
              </button>
              <button
                id="confirm-photo-btn"
                type="button"
                onClick={confirmPhoto}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Confirmar e Usar Foto
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Alternar câmera frontal/traseira (celular/tablet) */}
                <button
                  id="switch-camera-btn"
                  type="button"
                  onClick={toggleCameraFacing}
                  title="Alternar Câmera Frontal / Traseira"
                  className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Abrir câmera nativa do celular/tablet */}
                <button
                  id="mobile-native-camera-btn"
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  title="Tirar foto usando o app de câmera nativo do celular ou tablet"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  Câmera Nativa
                </button>

                {/* Enviar da galeria / arquivo (notebook ou tablet) */}
                <button
                  id="upload-file-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-600" />
                  Galeria / Arquivo
                </button>
              </div>

              <button
                id="shutter-capture-btn"
                type="button"
                onClick={takeSnapshot}
                disabled={isProcessing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                Capturar Foto Agora
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
