// entry point isolado, só pra gerar os 4 thumbnails de tema mostrados no
// quiz (etapa "themepalette") — renderiza cada ThemedSite com dados de
// exemplo fixos (sem quiz, sem Supabase). Usado via theme-preview.html +
// Playwright (script one-off, ver scratchpad da sessão que criou isto).
// Não faz parte do fluxo do app — pode ser removido depois de gerar as imagens.
import React from "react";
import ReactDOM from "react-dom/client";
import { SitePreview } from "./App.jsx";
import { SitePreviewEditorial } from "./ThemeEditorial.jsx";
import { SitePreviewOlosirkon } from "./ThemeOlosirkon.jsx";
import { SitePreviewTerra } from "./ThemeTerra.jsx";
import { DEFAULT_COLOR_SCHEME } from "./colorSchemes.js";

const SAMPLE = {
  name: "Marina Costa",
  title: "Psicóloga Clínica",
  email: "contato@marinacosta.com",
  badge: "Atendimento 100% Online",
  headline: "Equilíbrio emocional através da terapia.",
  subheadline: "Psicoterapia baseada em evidências, no seu ritmo.",
  photo: "",
  logo: "",
  whatsapp: "5511999999999",
  instagram: "marinacosta.psi",
  modalidade: "online",
  endereco: "",
  specialties: [
    { t: "Ansiedade", d: "Recupere o equilíbrio emocional e viva com mais tranquilidade." },
    { t: "Autoestima", d: "Reconstrua uma relação mais gentil e confiante consigo mesmo." },
    { t: "Relacionamentos", d: "Fortaleça vínculos com comunicação mais assertiva." },
    { t: "Autoconhecimento", d: "Um espaço seguro para se compreender e crescer." },
  ],
  specialtiesVariant: "grid",
  benefits: [
    { t: "Conforto", d: "Sessões no ambiente onde você se sente mais seguro." },
    { t: "Acessibilidade", d: "Atendimento onde você estiver." },
    { t: "Economia", d: "Sem deslocamento nem tempo no trânsito." },
    { t: "Privacidade", d: "Plataforma de vídeo segura e criptografada." },
  ],
  methodTitle: "Sobre a abordagem",
  methodText: "Uma escuta clínica baseada em evidências, colaborativa e respeitosa com o seu tempo.\n\nO trabalho é conjunto: identificamos padrões que geram sofrimento e desenvolvemos recursos mais saudáveis.",
  bio: "Busco proporcionar um ambiente acolhedor e seguro, onde você possa se expressar livremente.",
  faq: [
    { q: "Como funciona o atendimento?", a: "Sessões semanais de 50 minutos, por videochamada." },
    { q: "Aceita convênio?", a: "O atendimento é particular. Emito recibo para reembolso." },
  ],
  preco: null,
  waMessage: "Olá! Vi seu site e tenho interesse em agendar uma consulta.",
  colorScheme: DEFAULT_COLOR_SCHEME,
};

const THEME_COMPONENTS = {
  classic: SitePreview,
  editorial: SitePreviewEditorial,
  olosirkon: SitePreviewOlosirkon,
  terra: SitePreviewTerra,
};

const params = new URLSearchParams(window.location.search);
const themeKey = params.get("theme") || "classic";
const Component = THEME_COMPONENTS[themeKey] || SitePreview;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Component d={SAMPLE} />
  </React.StrictMode>
);
