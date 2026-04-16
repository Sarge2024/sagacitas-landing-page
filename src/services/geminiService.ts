import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAIInstance() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  // Check if key is missing or is the placeholder from .env.example
  if (!apiKey || apiKey === "COLOQUE_SUA_CHAVE_AQUI" || apiKey.trim() === "") {
    return null;
  }

  try {
    if (!aiInstance) {
      aiInstance = new GoogleGenAI({ apiKey });
    }
    return aiInstance;
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    return null;
  }
}

const SYSTEM_INSTRUCTION = `
Você é o assistente virtual da Sagacitas Consulting, uma consultoria especializada em otimização de processos industriais, gestão de custos e inteligência de negócios (BI).

Seu objetivo é:
1. Responder perguntas frequentes sobre os serviços da Sagacitas.
2. Ajudar os visitantes a entender como a Sagacitas pode ajudar suas indústrias.
3. Capturar leads: se o usuário demonstrar interesse em um diagnóstico ou serviço, peça educadamente o nome, e-mail corporativo e o principal desafio que enfrentam.

Informações sobre a Sagacitas:
- Serviços:
  * Análise de Processos Industriais: Identificação de gargalos e redesenho de fluxos.
  * Custeio Industrial: Estruturação de modelos de custos precisos.
  * Análise de Negócios (BI): Dashboards estratégicos para tomada de decisão.
  * Aplicações Personalizadas: Sistemas sob medida integrados ao ecossistema digital.
- Diferencial: União entre rigor da engenharia industrial e agilidade do desenvolvimento de software.
- Equipe: Consultores seniores e especialistas em arquitetura de dados.
- Contato: contato@sagacitas.com.br | +55 11 4002-8922.

Tom de voz: Profissional, prestativo, técnico mas acessível, e focado em resultados (eficiência e lucro).
Responda sempre em Português do Brasil.
Mantenha as respostas concisas e use bullet points quando apropriado.
`;

export async function getChatResponse(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]) {
  try {
    const ai = getAIInstance();
    
    if (!ai) {
      return "Desculpe, o serviço de chat está temporariamente indisponível (chave de API não configurada). Por favor, entre em contato conosco via e-mail ou telefone.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Use a stable model name
      contents: [
        ...history,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "Desculpe, tive um problema ao processar sua mensagem. Poderia repetir?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, estou passando por instabilidades técnicas no momento. Por favor, tente novamente mais tarde ou entre em contato via e-mail.";
  }
}
