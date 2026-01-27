import React, { useState, useRef } from 'react';
import { 
  FileSearch, 
  ChevronLeft, 
  Zap
} from 'lucide-react';
import FileUploader from './components/FileUploader';
import Dashboard from './components/Dashboard';
import ConversationDetail from './components/ConversationDetail';
import { ConversationReport, AnalysisResult, Conversation, EngineSettings } from './types';
import { analyzeConversations } from './services/geminiService';

const App: React.FC = () => {
  const [report, setReport] = useState<ConversationReport | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [progress, setProgress] = useState<{current: number, total: number} | null>(null);
  const [selectedConvoId, setSelectedConvoId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Analysis Scope Settings
  const [scopeMode, setScopeMode] = useState<'all' | 'count' | 'percent'>('all');
  const [scopeValue, setScopeValue] = useState<number>(100);

  // Engine Configuration Settings
  const [engineSettings, setEngineSettings] = useState<EngineSettings>({
    model: 'gemini-3-flash-preview',
    batchSize: 40,
    rpm: 15
  });
  
  // Ref to track cancellation
  const isCancelledRef = useRef(false);

  const handleUpload = (data: any) => {
    try {
      let rawList: any[] = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (data.conversations && Array.isArray(data.conversations)) {
        rawList = data.conversations;
      } else {
        throw new Error("Invalid format. Expected an array of conversations or a 'conversations' key.");
      }

      let earliestTs = Infinity;
      let latestTs = -Infinity;

      const normalized: Conversation[] = rawList.map((item: any, index: number) => {
        const id = item.conversationId || item.id || `conv-${index}`;
        
        let rawDate = item.conversationCreated || item.timestamp || item.created;
        if (typeof rawDate === 'number' && rawDate < 10000000000) rawDate *= 1000;
        
        const dateObj = new Date(rawDate);
        const timestampMs = dateObj.getTime();
        
        if (!isNaN(timestampMs)) {
          earliestTs = Math.min(earliestTs, timestampMs);
          latestTs = Math.max(latestTs, timestampMs);
        }

        const timestamp = isNaN(timestampMs) ? new Date().toISOString() : dateObj.toISOString();

        const messages = (item.transcript || item.messages || []).map((m: any) => ({
          role: m.role || (m.participantType === 'USER' ? 'user' : 'agent'),
          text: m.text || m.content || '',
          timestamp: m.timestamp || m.created
        }));

        const satisfactionMetric = item.metrics?.find((m: any) => m.code === 'satisfaction_score');
        const resMetric = item.metrics?.find((m: any) => m.code === 'resolution_status');
        const closureStatusMetric = item.metrics?.find((m: any) => m.code === 'InteractionClosureStatus');
        const resolvedValue = resMetric?.value || closureStatusMetric?.value || item.resolution_status;

        const ameliaCount = item.metrics?.find((m: any) => m.code === 'amelia_utterance_count')?.value || 0;
        const userCount = item.metrics?.find((m: any) => m.code === 'end_user_utterance_count')?.value || 0;
        const totalUtterances = (typeof ameliaCount === 'number' ? ameliaCount : 0) + (typeof userCount === 'number' ? userCount : 0);

        const intentMetric = item.metrics?.find((m: any) => m.code === 'IntentValidation');
        const primaryIntent = item.metrics?.find((m: any) => m.code === 'TriggeredIntent')?.value;

        return {
          id,
          timestamp,
          messages,
          metadata: {
            ...item,
            satisfactionScore: satisfactionMetric?.value,
            resolutionStatus: resolvedValue,
            totalUtterances: totalUtterances > 0 ? totalUtterances : undefined,
            primaryIntent: primaryIntent,
            intentValidation: intentMetric?.value
          }
        };
      });

      setReport({ 
        conversations: normalized,
        timeRange: earliestTs !== Infinity ? {
          start: new Date(earliestTs).toISOString(),
          end: new Date(latestTs).toISOString()
        } : undefined
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to process the JSON file.");
    }
  };

  const handleRunAnalysis = async () => {
    if (!report) return;
    
    // Check for API key if environment supports it
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Proceeding assuming the key selection dialog was handled
      }
    }

    setIsAnalyzing(true);
    setIsConsolidating(false);
    isCancelledRef.current = false;
    setProgress({ current: 0, total: 1 });
    setError(null);

    // Filter conversations based on scope settings
    let conversationsToProcess = report.conversations;
    if (scopeMode === 'count') {
      conversationsToProcess = report.conversations.slice(0, scopeValue);
    } else if (scopeMode === 'percent') {
      const count = Math.ceil((scopeValue / 100) * report.conversations.length);
      conversationsToProcess = report.conversations.slice(0, count);
    }

    try {
      const result = await analyzeConversations(
        conversationsToProcess, 
        engineSettings, 
        (current, total) => {
          setProgress({ current, total });
          if (isCancelledRef.current) return false; 
        },
        (status) => {
          if (status === 'consolidating') setIsConsolidating(true);
        }
      );
      setAnalysis(result);
    } catch (err: any) {
      if (!isCancelledRef.current) {
        if (err.message?.includes("Requested entity was not found") || err.message?.includes("API Key")) {
           setError("API Key Error: Please select a valid paid project API key in settings.");
           if (window.aistudio) await window.aistudio.openSelectKey();
        } else {
           setError(err.message || "Failed to analyze conversations.");
        }
      }
    } finally {
      setIsAnalyzing(false);
      setIsConsolidating(false);
      setProgress(null);
      isCancelledRef.current = false;
    }
  };

  const handleHalt = () => {
    isCancelledRef.current = true;
    // Explicitly set consolidating true so UI updates immediately
    setIsConsolidating(true);
  };

  const reset = () => {
    setReport(null);
    setAnalysis(null);
    setSelectedConvoId(null);
    setError(null);
    setProgress(null);
    setIsConsolidating(false);
    isCancelledRef.current = false;
  };

  const selectedConversation = report?.conversations.find(c => c.id === selectedConvoId);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Zap className="text-white w-6 h-6" fill="white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Use Case Mapper
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {report && (
            <button
              onClick={reset}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Start Over
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10">
        {!report ? (
          <div className="animate-fadeIn">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                Interaction Analysis Console
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Upload your JSON reports to extract deep behavioral insights. Configure your processing engine for speed or detail.
              </p>
            </div>
            <FileUploader onUpload={handleUpload} />
          </div>
        ) : (
          <Dashboard 
            report={report} 
            analysis={analysis} 
            onAnalyze={handleRunAnalysis}
            onHalt={handleHalt}
            isAnalyzing={isAnalyzing}
            isConsolidating={isConsolidating}
            progress={progress}
            onSelectConversation={setSelectedConvoId}
            scopeSettings={{ mode: scopeMode, value: scopeValue, setMode: setScopeMode, setValue: setScopeValue }}
            engineSettings={engineSettings}
            setEngineSettings={setEngineSettings}
          />
        )}

        {error && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-slideUp z-50">
            <FileSearch className="w-5 h-5" />
            <span className="font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 font-bold opacity-70 hover:opacity-100">✕</button>
          </div>
        )}
      </main>

      {selectedConversation && (
        <ConversationDetail 
          conversation={selectedConversation} 
          onClose={() => setSelectedConvoId(null)} 
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;