import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Headphones } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';
import { listProfiles } from '../services/profiles';
import { getClienteByEmail } from '../services/clientes';
import { useAuth } from '../AuthContext';
import { abrirSoporte } from './SoporteWidget';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export function Chatbot() {
  const { user, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Hola, soy el asistente de To Paquete. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State to hold agent data for the prompt
  const [agentsData, setAgentsData] = useState<any[]>([]);
  const [clientAgentId, setClientAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Fetch agents and client info
  useEffect(() => {
    const fetchContextData = async () => {
      try {
        // Fetch all agents
        const agents = await listProfiles({ role: 'agente' });
        setAgentsData(agents);

        // If user is a client, fetch their assigned agent
        if (role === 'cliente' && user?.email) {
          const clientData = await getClienteByEmail(user.email);
          if (clientData?.agenteId) {
            setClientAgentId(clientData.agenteId);
          }
        }
      } catch (error) {
        console.error("Error fetching context data for chatbot:", error);
      }
    };

    fetchContextData();
  }, [user, role]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error: La API Key de Gemini no está configurada. Por favor, contacta al administrador." }]);
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Build context about agents and prices
      let agentsContext = "Lista de agentes y sus precios por kilo:\n";
      let minPrice = Infinity;
      let maxPrice = 0;
      
      agentsData.forEach(ag => {
        const price = ag.precioPorKilo || 0;
        if (price > 0) {
          if (price < minPrice) minPrice = price;
          if (price > maxPrice) maxPrice = price;
        }
        agentsContext += `- Agente: ${ag.name || ag.email} (ID: ${ag.id}). Precio: €${price}/kg\n`;
      });

      if (minPrice === Infinity) minPrice = 0;

      let clientContext = "";
      if (clientAgentId) {
        const assignedAgent = agentsData.find(a => a.id === clientAgentId);
        if (assignedAgent) {
          clientContext = `El usuario actual es un cliente y su agente asignado es ${assignedAgent.name || assignedAgent.email}. Su precio aplicable es €${assignedAgent.precioPorKilo || 0}/kg.`;
        }
      }

      const systemInstruction = `Eres el asistente virtual de 'To Paquete', una agencia de envíos a Cuba.
Reglas estrictas sobre precios:
1. NUNCA des un precio general o primario del administrador. Los precios dependen del agente.
2. Si el cliente pregunta por precios u ofertas y NO sabemos quién es su agente:
   - Dale un rango de precios (ej. entre €${minPrice} y €${maxPrice} por kilo).
   - Pregúntale qué agente le atiende para darle su precio exacto.
   - Si dice que no tiene agente, dile que le asignaremos uno en dependencia de su cercanía o ubicación.
3. Si el cliente ya tiene un agente asignado (ver contexto del cliente), dale el precio exacto de su agente.
4. Sé amable, conciso y profesional.

Contexto de Agentes:
${agentsContext}

Contexto del Cliente Actual:
${clientContext ? clientContext : "No se conoce el agente del cliente actual."}
`;

      // Convert previous messages to Gemini format
      const contents = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: userText }] });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text || "Lo siento, hubo un error al procesar tu solicitud." }]);
    } catch (error) {
      console.error("Error calling Gemini:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Lo siento, estoy teniendo problemas técnicos en este momento. Por favor, intenta de nuevo más tarde." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 bg-tp-red hover:bg-[#D91F33] text-white rounded-full shadow-lg flex items-center justify-center transition-all z-40 hover:scale-105",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-tp-gray-soft flex flex-col z-50 transition-all origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="h-16 bg-tp-blue text-white rounded-t-2xl flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Asistente TP</h3>
              <p className="text-xs text-white/70">Soporte Operativo</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-tp-blue text-white" : "bg-tp-blue-light text-tp-blue"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                msg.role === 'user' 
                  ? "bg-tp-blue text-white rounded-tr-none" 
                  : "bg-white border border-tp-gray-soft text-tp-blue rounded-tl-none shadow-sm"
              )}>
                {msg.role === 'user' ? (
                  msg.text
                ) : (
                  <div className="markdown-body prose prose-sm prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-tp-blue">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-tp-blue-light text-tp-blue flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-tp-gray-soft rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                <div className="w-2 h-2 bg-tp-blue/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-tp-blue/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-tp-blue/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Acceso rápido a soporte humano */}
        <div className="px-4 py-2 bg-white border-t border-tp-gray-soft flex items-center justify-between gap-3">
          <span className="text-[11px] text-tp-blue/40 font-medium">¿Necesitas ayuda de un agente?</span>
          <button
            type="button"
            onClick={() => { setIsOpen(false); abrirSoporte(); }}
            className="flex items-center gap-1.5 text-[11px] font-bold text-tp-blue hover:text-tp-red transition-colors shrink-0"
          >
            <Headphones className="w-3.5 h-3.5" />
            Contactar soporte
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-tp-gray-soft rounded-b-2xl">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-tp-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-tp-blue/20 text-sm text-tp-blue"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-tp-blue hover:text-tp-red disabled:opacity-50 disabled:hover:text-tp-blue transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
