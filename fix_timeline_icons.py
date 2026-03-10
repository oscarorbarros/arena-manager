# -*- coding: utf-8 -*-
path = "src/app/match/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
r_block = """                                  {/* Event Card */}
                                  <div className="flex-1 pb-8">
                                      {(() => {
                                          let bgClass = "bg-white border-gray-100";
                                          let iconClass = "bg-gray-100 text-gray-600";
                                          let textClass = "text-gray-700";
                                          let Icon = Clock;
                                          let label = "Informação";

                                          if (event.type === "goal" || event.type === "penalty_goal") {
                                              bgClass = "bg-green-50/50 border-green-100";
                                              iconClass = "bg-green-100 text-green-600";
                                              textClass = "text-green-700";
                                              Icon = Goal;
                                              label = "GOOOOL!";
                                          } else if (event.type === "card_red") {
                                              bgClass = "bg-red-50/50 border-red-100";
                                              iconClass = "bg-red-100 text-red-600";
                                              textClass = "text-red-700";
                                              Icon = ShieldAlert;
                                              label = "Cartão Vermelho";
                                          } else if (event.type === "card_yellow") {
                                              bgClass = "bg-yellow-50/50 border-yellow-100";
                                              iconClass = "bg-yellow-100 text-yellow-600";
                                              textClass = "text-yellow-700";
                                              Icon = ShieldAlert;
                                              label = "Cartão Amarelo";
                                          } else if (event.type === "start" || event.type === "end") {
                                              bgClass = "bg-blue-50/50 border-blue-100";
                                              iconClass = "bg-blue-100 text-blue-600";
                                              textClass = "text-blue-700";
                                              Icon = Clock;
                                              label = event.type === "start" ? "Início de Jogo" : "Fim de Jogo";
                                              if (event.observation?.includes("Tempo")) label = event.observation; // Use observation as label for halftime start/end
                                          } else if (event.type === "penalty_miss") {
                                              bgClass = "bg-red-50/50 border-red-100";
                                              iconClass = "bg-red-100 text-red-600";
                                              textClass = "text-red-700";
                                              Icon = ShieldAlert; 
                                              label = "Pênalti Perdido";
                                          }

                                          return (
                                              <div className={`p-5 rounded-xl border flex items-start gap-4 shadow-sm transition-all hover:shadow-md ${bgClass}`}>
                                                  <div className={`p-3 rounded-full shrink-0 ${iconClass}`}>
                                                      <Icon className="w-5 h-5" />
                                                  </div>
                                                  <div>
                                                      <div className={`font-black uppercase tracking-wide text-sm mb-1 ${textClass}`}>
                                                          {label}
                                                      </div>
                                                      <div className="font-bold text-gray-900 text-lg leading-tight">
                                                          {event.observation !== label ? event.observation : ""}
                                                      </div>
                                                      {event.teamId && (
                                                        <div className="text-xs font-bold uppercase mt-2 text-gray-400 flex items-center gap-1">
                                                            {event.teamId === match.teamAId ? <span className="text-[#06aa48]">{teamA?.name}</span> : <span className="text-[#06aa48]">{teamB?.name}</span>}
                                                        </div>
                                                      )}
                                                  </div>
                                              </div>
                                          );
                                      })()}
                                  </div>"""
content = content.replace(t_block, r_block)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
