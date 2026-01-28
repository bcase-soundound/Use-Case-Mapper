import React, { memo, useState } from 'react';
import { 
  ResponsiveContainer, Cell, PieChart, Pie, Tooltip
} from 'recharts';
import { 
  TrendingUp, Users, MessageSquare, AlertTriangle, CheckCircle2, Info, Lightbulb,
  ArrowRight, Star, Briefcase, Globe, Calendar, Clock, Loader2, StopCircle, Settings, Layers, FastForward, Sparkles, ChevronDown, ChevronUp, Key, Eye, EyeOff, Lock
} from 'lucide-react';
import { ConversationReport, AnalysisResult, Conversation, EngineSettings } from '../types';

interface DashboardProps {
  report: ConversationReport;
  analysis: AnalysisResult | null;
  onAnalyze: () => void;
  onHalt: () => void;
  isAnalyzing: boolean;
  isConsolidating: boolean;
  progress: { current: number, total: number } | null;
  onSelectConversation: (id: string | number) => void;
  scopeSettings: {
    mode: 'all' | 'count' | 'percent';
    value: number;
    setMode: (m: 'all' | 'count' | 'percent') => void;
    setValue: (v: number) => void;
  };
  engineSettings: EngineSettings;
  setEngineSettings: (s: EngineSettings) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const ConversationList = memo(({ 
  conversations, 
  onSelectConversation 
}: { 
  conversations: Conversation[], 
  onSelectConversation: (id: string | number) => void 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900">Dataset Records</h2>
        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{conversations.length} RECORDS</span>
      </div>
      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {conversations.map((conv) => {
          const displayCount = conv.messages?.length > 0 ? conv.messages.length : (conv.metadata?.totalUtterances || 0);
          const resolution = conv.metadata?.resolutionStatus || '';
          return (
            <div 
              key={conv.id} 
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm text-sm ${
                    ['RESOLVED', 'Closed', 'true'].includes(resolution) ? 'bg-green-100 text-green-700' :
                    ['UNRESOLVED', 'Abandoned', 'Open'].includes(resolution) ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {resolution.charAt(0) || '#'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{conv.id}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {conv.timestamp ? new Date(conv.timestamp).toLocaleString() : 'No Date'} • {conv.metadata?.initialChannel || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-[9px] uppercase text-gray-400 font-black">Volume</div>
                    <div className="text-sm font-bold text-gray-800">{displayCount} turns</div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="text-[9px] uppercase text-gray-400 font-black">Status</div>
                    <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded inline-block ${
                      ['RESOLVED', 'Closed', 'true'].includes(resolution) ? 'bg-green-50 text-green-600' :
                      ['UNRESOLVED', 'Abandoned', 'Open'].includes(resolution) ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {resolution || 'N/A'}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-all translate-x-0 group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const Dashboard: React.FC<DashboardProps> = ({ 
  report, 
  analysis, 
  onAnalyze, 
  onHalt,
  isAnalyzing,
  isConsolidating,
  progress,
  onSelectConversation,
  scopeSettings,
  engineSettings,
  setEngineSettings,
  apiKey,
  setApiKey
}) => {
  const [configExpanded, setConfigExpanded] = useState(!analysis);
  const [showApiKey, setShowApiKey] = useState(false);

  const conversations = report?.conversations || [];
  const totalConvos = conversations.length;
  
  const totalMessages = conversations.reduce((acc, conv) => {
    const transcriptLength = conv.messages?.length || 0;
    const metricCount = conv.metadata?.totalUtterances || 0;
    return acc + (transcriptLength > 0 ? transcriptLength : metricCount);
  }, 0);
  
  const avgMessages = totalConvos > 0 ? Math.round(totalMessages / totalConvos) : 0;

  const validScores = conversations.filter(c => typeof c.metadata?.satisfactionScore === 'number');
  const avgSatisfaction = validScores.length > 0 
    ? (validScores.reduce((acc, c) => acc + (c.metadata?.satisfactionScore || 0), 0) / validScores.length).toFixed(2)
    : 'N/A';

  const timeRange = report.timeRange ? (
    `${new Date(report.timeRange.start).toLocaleDateString()} - ${new Date(report.timeRange.end).toLocaleDateString()}`
  ) : 'N/A';

  const sentimentData = analysis?.sentimentDistribution ? [
    { name: 'Positive', value: Math.round(analysis.sentimentDistribution.positive) || 0, color: '#10b981' },
    { name: 'Neutral', value: Math.round(analysis.sentimentDistribution.neutral) || 0, color: '#64748b' },
    { name: 'Negative', value: Math.round(analysis.sentimentDistribution.negative) || 0, color: '#ef4444' },
  ] : [];

  const targetCount = scopeSettings.mode === 'all' 
    ? totalConvos 
    : scopeSettings.mode === 'count' 
      ? Math.min(scopeSettings.value, totalConvos)
      : Math.ceil((scopeSettings.value / 100) * totalConvos);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Conversations</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalConvos}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Time Range</h3>
          </div>
          <p className="text-sm font-bold text-gray-900 truncate" title={timeRange}>{timeRange}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Avg CSAT</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgSatisfaction}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Avg Length</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgMessages} turns</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          {!analysis ? (
            <div className="space-y-2">
               {isAnalyzing ? (
                <button
                  onClick={onHalt}
                  disabled={isConsolidating}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                    isConsolidating 
                      ? 'bg-amber-50 text-amber-600 border-amber-100 cursor-not-allowed' 
                      : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                  }`}
                >
                  {isConsolidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[10px] uppercase">Finalizing...</span>
                    </>
                  ) : (
                    <>
                      <StopCircle className="w-4 h-4" />
                      <span className="text-[10px] uppercase">Halt & Results</span>
                    </>
                  )}
                  <span className="text-[9px] font-normal opacity-70">
                    {progress ? `Batch ${progress.current}/${progress.total}` : "Starting..."}
                  </span>
                </button>
              ) : (
                <button
                  onClick={onAnalyze}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Start Analysis</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-gray-900 text-sm font-bold">Analyzed</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase">View Insights Below</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Section (Always accessible) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button 
          onClick={() => setConfigExpanded(!configExpanded)}
          className="w-full px-8 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-800">Engine Configuration & Scope</h2>
          </div>
          {configExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        
        {configExpanded && (
          <div className="p-8 border-t border-gray-100 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Scope & API Key Settings */}
              <div className="space-y-6">
                {/* API Key Input */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Key className="w-3 h-3 text-blue-500" /> Manual Gemini API Key
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showApiKey ? "text" : "password"}
                      disabled={isAnalyzing}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your Gemini API key..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-12 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed italic">
                    Setting the key here will override any hardcoded environment variables. Your key is persisted locally in your browser.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Analysis Mode</label>
                  <div className="flex bg-gray-100 p-1.5 rounded-xl w-fit">
                    {(['all', 'count', 'percent'] as const).map(mode => (
                      <button
                        key={mode}
                        disabled={isAnalyzing}
                        onClick={() => scopeSettings.setMode(mode)}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                          scopeSettings.mode === mode 
                            ? 'bg-white text-blue-600 shadow-md' 
                            : 'text-gray-500 hover:text-gray-700 disabled:opacity-50'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {scopeSettings.mode !== 'all' && (
                  <div className="space-y-3 animate-fadeIn">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      {scopeSettings.mode === 'count' ? 'Max Record Count' : 'Percentage Amount'}
                    </label>
                    <div className="relative w-40">
                      <input
                        type="number"
                        disabled={isAnalyzing}
                        value={scopeSettings.value}
                        onChange={(e) => scopeSettings.setValue(parseInt(e.target.value) || 0)}
                        className="bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm font-bold w-full outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 disabled:opacity-50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase pointer-events-none">
                        {scopeSettings.mode === 'percent' ? '%' : 'Recs'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Target Sampling</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-blue-600">{targetCount}</span>
                    <span className="text-sm font-medium text-gray-400">/ {totalConvos} conversations</span>
                  </div>
                </div>
              </div>

              {/* Engine Settings */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">AI Model Selection</label>
                  <select 
                    disabled={isAnalyzing}
                    value={engineSettings.model}
                    onChange={(e) => setEngineSettings({...engineSettings, model: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-gray-900 disabled:opacity-50"
                  >
                    <optgroup label="Gemini 3 Series">
                      <option value="gemini-3-pro-preview">Gemini 3 Pro (Deep Reasoning)</option>
                      <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast & Efficient)</option>
                    </optgroup>
                    <optgroup label="Gemini 2.5 Series">
                      <option value="gemini-3-pro-preview">Gemini 2.5 Pro</option>
                      <option value="gemini-flash-latest">Gemini 2.5 Flash</option>
                      <option value="gemini-flash-lite-latest">Gemini 2.5 Flash Lite</option>
                    </optgroup>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Layers className="w-3 h-3" /> Batch Size
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        disabled={isAnalyzing}
                        value={engineSettings.batchSize}
                        onChange={(e) => setEngineSettings({...engineSettings, batchSize: parseInt(e.target.value) || 1})}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold w-full outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-gray-900 disabled:opacity-50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 uppercase">Per Req</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FastForward className="w-3 h-3" /> Rate (RPM)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        disabled={isAnalyzing}
                        value={engineSettings.rpm}
                        onChange={(e) => setEngineSettings({...engineSettings, rpm: parseInt(e.target.value) || 1})}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold w-full outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-gray-900 disabled:opacity-50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 uppercase">Limit</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Consolidation Loading State */}
      {isConsolidating && (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-2xl animate-slideUp border-b-4 border-indigo-800">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black mb-2 flex items-center gap-2 justify-center md:justify-start">
                Finalizing Dataset Insights
              </h2>
              <p className="text-indigo-100 max-w-xl text-lg opacity-90">
                Processing halted. We're now consolidating patterns and use cases discovered in the processed batches into a unified global report. This usually takes 5-10 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-8 animate-fadeIn">
          {/* Identified Use Cases Strip */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" /> Use Case Mapping
              </h2>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100 px-3 py-1 rounded-full">
                  Model: {engineSettings.model}
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Mapped from sample processing
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(analysis.identifiedUseCases || []).map((uc, idx) => (
                <div key={idx} className="group p-6 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase rounded-md flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {uc.vertical}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold uppercase rounded-md flex items-center gap-1">
                        <Users className="w-3 h-3" /> {uc.audience}
                      </span>
                    </div>
                    <div className="bg-indigo-600 text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-sm">
                      {uc.count} CONVOS
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{uc.task}</h4>
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 font-medium">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    Channel: {uc.channel}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{uc.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" /> Executive Summary
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8">{analysis.summary}</p>

                <h3 className="text-lg font-semibold text-gray-800 mb-4">Core Strategic Takeaways</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(analysis.keyTakeaways || []).map((takeaway, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100/50">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                      <span className="text-sm text-gray-700 leading-relaxed">{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" /> Dataset-Wide Patterns
                </h2>
                <div className="space-y-6">
                  {(analysis.commonPatterns || []).map((pattern, idx) => (
                    <div key={idx} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-800">{pattern.title}</h4>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          pattern.frequency === 'High' ? 'bg-red-100 text-red-700' :
                          pattern.frequency === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {pattern.frequency}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{pattern.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest text-gray-400">
                  Global Sentiment
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-between px-4">
                  {sentimentData.map((d) => (
                    <div key={d.name} className="text-center">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{d.name}</div>
                      <div className="text-lg font-black" style={{ color: d.color }}>{d.value}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" /> Key Friction Points
                </h3>
                <ul className="space-y-4">
                  {(analysis.topIssues || []).map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2" />
                      <span className="leading-relaxed">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConversationList 
        conversations={conversations} 
        onSelectConversation={onSelectConversation} 
      />
    </div>
  );
};

export default Dashboard;