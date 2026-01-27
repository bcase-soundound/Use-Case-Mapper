import React from 'react';
import { X, User, Bot, Clock, Tag, ChevronLeft, Target, BarChart2, Info, Activity } from 'lucide-react';
import { Conversation } from '../types';

interface ConversationDetailProps {
  conversation: Conversation;
  onClose: () => void;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversation, onClose }) => {
  const messages = conversation?.messages || [];
  const topics = conversation.metadata?.topics || [];
  const keyAspects = conversation.metadata?.keyAspects ? Object.values(conversation.metadata.keyAspects) : [];
  const metrics = conversation.metadata?.metrics || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">ID: {conversation.id}</h2>
              <p className="text-sm text-gray-500">{conversation.timestamp ? new Date(conversation.timestamp).toLocaleString() : 'No Date'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content (Transcript, Topics, or Key Aspects) */}
          <div className="lg:col-span-2 space-y-6">
            {messages.length > 0 ? (
              <div className="space-y-6">
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Transcript</h3>
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-start' : 'items-end'}`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100' 
                          : 'bg-blue-50 text-blue-900 rounded-tr-none border border-blue-100'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Summarized Insights</h3>
                
                {/* Intent Validation (Service Desk Special) */}
                {conversation.metadata?.intentValidation && (
                  <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-100 space-y-2">
                    <div className="flex items-center gap-2 mb-2 opacity-80 uppercase text-[10px] font-bold tracking-widest">
                      <Activity className="w-4 h-4" /> User Intent detected
                    </div>
                    <p className="text-sm font-medium leading-relaxed">
                      {conversation.metadata.intentValidation}
                    </p>
                  </div>
                )}

                {/* Topics (Format 1) */}
                {topics.length > 0 && topics.map((topic, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold uppercase px-2 py-1 rounded">Topic {idx + 1}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                        topic.resolutionStatus === 'RESOLVED' || topic.resolutionStatus === 'PARTIALLY_RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {topic.resolutionStatus}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900">{topic.topicName}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed italic">"{topic.explanation}"</p>
                  </div>
                ))}

                {/* Key Aspects (Format 2) */}
                {topics.length === 0 && keyAspects.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {keyAspects.map((aspect: any, idx: number) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-800 text-sm">{aspect.name}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            aspect.sentiment === 'POSITIVE' ? 'bg-green-100 text-green-700' :
                            aspect.sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {aspect.sentiment}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Domain: {aspect.domain}</p>
                      </div>
                    ))}
                  </div>
                )}

                {topics.length === 0 && keyAspects.length === 0 && !conversation.metadata?.intentValidation && (
                  <div className="text-center py-12 text-gray-400 italic bg-white rounded-2xl border border-dashed border-gray-200">
                    No transcript or topic summaries available for this session.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panels (Metadata & Metrics) */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
            {/* Metadata Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" /> Context
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Channel</span>
                  <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-lg">{conversation.metadata?.initialChannel || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Resolution</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    ['RESOLVED', 'Closed', 'true'].includes(conversation.metadata?.resolutionStatus || '') ? 'bg-green-100 text-green-700' :
                    ['UNRESOLVED', 'Abandoned', 'Open'].includes(conversation.metadata?.resolutionStatus || '') ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {conversation.metadata?.resolutionStatus || 'UNKNOWN'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Satisfaction Index</span>
                  <p className="text-xl font-bold text-yellow-600">
                    {typeof conversation.metadata?.satisfactionScore === 'number' ? conversation.metadata.satisfactionScore.toFixed(2) : 'N/A'}
                  </p>
                </div>
                {conversation.metadata?.primaryIntent && (
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Primary Intent</span>
                    <p className="text-xs font-bold text-blue-600">{conversation.metadata.primaryIntent}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-500" /> Key Metrics
              </h3>
              <div className="space-y-3">
                {metrics.length > 0 ? metrics.filter(m => typeof m.value !== 'object').slice(0, 10).map((metric, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500 truncate mr-2 capitalize" title={metric.code}>{metric.code.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-bold text-gray-800 shrink-0">{String(metric.value)}</span>
                  </div>
                )) : (
                  <p className="text-xs text-gray-400 italic">No detailed metrics available.</p>
                )}
              </div>
            </div>

            {/* Cognitive/Agentic Card if present */}
            {conversation.metadata?.cognitiveAgentInstances && conversation.metadata.cognitiveAgentInstances.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-full">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-500" /> Cognitive Execution
                </h3>
                <div className="space-y-4">
                  {conversation.metadata.cognitiveAgentInstances.map((agent: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-blue-600">{agent.agentName}</span>
                        <span className="text-[10px] bg-white px-2 py-1 rounded-full shadow-sm">{agent.agentStatus}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-1">Goal: {agent.agentGoal}</p>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Result: {agent.goalResolutionStatus}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail;