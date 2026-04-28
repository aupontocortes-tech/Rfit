"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share2, X, Smartphone, Copy, Check, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DISMISS_KEY = "rfit-pwa-banner-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return isIOS() || /Android/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaInstallBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [showDesktopSteps, setShowDesktopSteps] = useState(false);
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined") return;

    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }

    if (isStandalone()) return;

    setAppUrl(window.location.href.split("#")[0]);

    setVisible(true);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* falha silenciosa em dev sem HTTPS em alguns hosts */
      });
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, [mounted]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const copyLink = useCallback(async () => {
    const url = appUrl || (typeof window !== "undefined" ? window.location.href : "");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado. Cole no navegador do celular ou do computador.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Copie o endereço manualmente na barra do navegador.");
    }
  }, [appUrl]);

  const installAndroid = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }, [deferred, dismiss]);

  const openIosHelp = useCallback(() => {
    setShowIosSteps((v) => !v);
  }, []);

  const downloadDesktopShortcut = useCallback(() => {
    const url = appUrl || (typeof window !== "undefined" ? window.location.href.split("#")[0] : "");
    const ini = `[InternetShortcut]\r\nURL=${url}\r\n`;
    const blob = new Blob([ini], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "RFIT.url";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Arquivo RFIT.url baixado. Coloque na Área de trabalho e abra para acessar o RFIT.");
  }, [appUrl]);

  if (!mounted || !visible) return null;

  const ios = isIOS();
  const mobile = isMobileDevice();

  return (
    <div
      className="relative z-[60] border-b border-border bg-card/95 backdrop-blur-md px-3 py-3 sm:px-4 shadow-sm"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            {mobile ? (
              <Smartphone className="h-5 w-5" aria-hidden />
            ) : (
              <Monitor className="h-5 w-5" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-foreground leading-snug">
              Use o RFIT como aplicativo
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              No <strong className="text-foreground">celular</strong>, copie o link ou instale pelo navegador.
              No <strong className="text-foreground">computador</strong>, baixe o atalho (.url) ou instale pelo Chrome / Edge quando aparecer o ícone de instalação.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 -mt-1 h-9 w-9 text-muted-foreground"
            onClick={dismiss}
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 min-h-11 touch-manipulation"
            onClick={copyLink}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar link"}
          </Button>

          {!ios && deferred && (
            <Button
              type="button"
              size="sm"
              className="gap-2 min-h-11 touch-manipulation bg-primary text-primary-foreground"
              onClick={installAndroid}
            >
              <Download className="h-5 w-5" />
              {mobile ? "Baixar / instalar app" : "Instalar no computador"}
            </Button>
          )}

          {!mobile && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-2 min-h-11 touch-manipulation"
              onClick={downloadDesktopShortcut}
            >
              <Download className="h-4 w-4" />
              Baixar atalho (.url)
            </Button>
          )}

          {ios && (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-2 min-h-11 touch-manipulation"
                onClick={openIosHelp}
              >
                <Share2 className="h-5 w-5" />
                Como instalar no iPhone
              </Button>
              <p className="w-full text-[11px] text-muted-foreground leading-snug">
                No iPhone: toque em <strong className="text-foreground">Compartilhar</strong>{" "}
                <Share2 className="inline h-3 w-3 align-text-bottom" /> e depois em{" "}
                <strong className="text-foreground">Adicionar à Tela de Início</strong>.
              </p>
            </>
          )}

          {!ios && !deferred && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2 min-h-11 touch-manipulation"
              onClick={() => {
                if (mobile) {
                  copyLink();
                  toast.message("Chrome: menu ⋮ → Instalar app ou Adicionar à tela inicial.");
                } else {
                  setShowDesktopSteps((v) => !v);
                }
              }}
            >
              <Download className="h-4 w-4" />
              {mobile ? "Dica de instalação" : "Como instalar no PC"}
            </Button>
          )}
        </div>

        {showIosSteps && ios && (
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside border border-border rounded-lg p-3 bg-muted/30">
            <li>Copie o link com o botão &quot;Copiar link&quot;.</li>
            <li>Abra o <strong className="text-foreground">Safari</strong> e cole na barra de endereço.</li>
            <li>Toque em <strong className="text-foreground">Compartilhar</strong> e em <strong className="text-foreground">Adicionar à Tela de Início</strong>.</li>
            <li>Confirme — o ícone do RFIT aparecerá como um app.</li>
          </ol>
        )}

        {showDesktopSteps && !ios && !mobile && (
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside border border-border rounded-lg p-3 bg-muted/30">
            <li>
              Use <strong className="text-foreground">Baixar atalho (.url)</strong> e arraste o arquivo para a Área de trabalho (Windows).
            </li>
            <li>
              No <strong className="text-foreground">Chrome</strong> ou <strong className="text-foreground">Edge</strong>, procure o ícone de{" "}
              <strong className="text-foreground">instalar</strong> na barra de endereço (monitor + seta) e confirme.
            </li>
            <li>
              Ou menu <strong className="text-foreground">⋮</strong> → <strong className="text-foreground">Instalar RFIT…</strong> /{" "}
              <strong className="text-foreground">Aplicativos</strong> → <strong className="text-foreground">Instalar esta página como aplicativo</strong>.
            </li>
          </ol>
        )}

        <p className="text-[10px] text-muted-foreground/80 truncate font-mono bg-muted/50 rounded px-2 py-1.5">
          {appUrl || "…"}
        </p>
      </div>
    </div>
  );
}
