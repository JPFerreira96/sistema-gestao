"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "../../components/DashboardShell";
import { fetchSession } from "../../lib/api";

type Operator = {
  id: string;
  name: string;
  team: string;
  photo?: string | null;
  present: boolean;
  note: string;
  score: number;
};

type EventReport = {
  id: string;
  title: string;
  date: string;
  totalAssigned: number;
  presentCount: number;
};

const operatorsSeed: Operator[] = [
  {
    id: "op-1",
    name: "Kai Andrade",
    team: "Alpha",
    photo: null,
    present: true,
    note: "Chegou cedo.",
    score: 100
  },
  {
    id: "op-2",
    name: "Lara Monteiro",
    team: "Bravo",
    photo: null,
    present: false,
    note: "Justificou falta.",
    score: 0
  },
  {
    id: "op-3",
    name: "Rui Cardoso",
    team: "Alpha",
    photo: null,
    present: true,
    note: "",
    score: 100
  },
  {
    id: "op-4",
    name: "Mila Souza",
    team: "Charlie",
    photo: null,
    present: true,
    note: "Apoio extra.",
    score: 100
  },
  {
    id: "op-5",
    name: "Joao Freitas",
    team: "Bravo",
    photo: null,
    present: false,
    note: "",
    score: 0
  }
];

const eventsSeed: EventReport[] = [
  { id: "ev-1", title: "Operacao Orion", date: "2025-01-12", totalAssigned: 10, presentCount: 8 },
  { id: "ev-2", title: "Controle Setor Norte", date: "2025-01-18", totalAssigned: 6, presentCount: 4 },
  { id: "ev-3", title: "Treinamento Base", date: "2025-01-25", totalAssigned: 12, presentCount: 11 }
];

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  const first = parts[0]?.charAt(0) ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase();
};

export default function ReportsPage() {
  const router = useRouter();
  const [operators, setOperators] = useState<Operator[]>(operatorsSeed);
  const [selectedEventId, setSelectedEventId] = useState(eventsSeed[0]?.id ?? "");
  const [generalNote, setGeneralNote] = useState("");
  const [dateStart, setDateStart] = useState("2025-01-01");
  const [dateEnd, setDateEnd] = useState("2025-01-31");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"attendance" | "report">("attendance");

  useEffect(() => {
    fetchSession()
      .then((session) => {
        if (!session.mfaEnabled) {
          router.push("/mfa");
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          router.push("/");
        }
      });
  }, [router]);

  const selectedEvent = eventsSeed.find((eventItem) => eventItem.id === selectedEventId);

  const attendanceRate = useMemo(() => {
    if (!selectedEvent) {
      return 0;
    }
    if (selectedEvent.totalAssigned === 0) {
      return 0;
    }
    return Math.round((selectedEvent.presentCount / selectedEvent.totalAssigned) * 100);
  }, [selectedEvent]);

  const filteredOperators = useMemo(() => {
    if (teamFilter === "ALL") {
      return operators;
    }
    return operators.filter((item) => item.team === teamFilter);
  }, [operators, teamFilter]);

  const operatorRanking = useMemo(() => {
    const list = [...operators].sort((a, b) => b.score - a.score);
    return {
      top: list.slice(0, 5),
      bottom: list.slice(-5).reverse()
    };
  }, [operators]);

  const handleTogglePresence = (id: string) => {
    setOperators((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, present: !item.present, score: item.present ? 0 : 100 }
          : item
      )
    );
  };

  return (
    <DashboardShell title="Painel Administrativo" subtitle="Relatorios e Comparecimento">
      <div className="dashboard-body">
        <div className="page-header">
          <div>
            <h1>Relatorios de Eventos</h1>
            <p>Controle presenca, pontuacao e comparecimento dos operadores</p>
          </div>
          <button className="primary-btn" type="button">
            Exportar PDF
          </button>
        </div>

        <div className="report-tabs">
          <button
            type="button"
            className={`report-tab ${activeTab === "attendance" ? "active" : ""}`}
            onClick={() => setActiveTab("attendance")}
          >
            Presenca do evento
          </button>
          <button
            type="button"
            className={`report-tab ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            Relatorio por periodo
          </button>
        </div>

        {activeTab === "attendance" ? (
          <section className="report-single">
            <div className="report-card">
              <h3>Controle de presenca</h3>
              <p>Selecione um evento e marque comparecimento.</p>

              <div className="report-filters">
                <div>
                  <label>Evento</label>
                  <select
                    value={selectedEventId}
                    onChange={(event) => setSelectedEventId(event.target.value)}
                  >
                    {eventsSeed.map((eventItem) => (
                      <option key={eventItem.id} value={eventItem.id}>
                        {eventItem.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Inicio</label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(event) => setDateStart(event.target.value)}
                  />
                </div>
                <div>
                  <label>Fim</label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(event) => setDateEnd(event.target.value)}
                  />
                </div>
              </div>

              <div className="attendance-summary">
                <div>
                  <span>Total escalados</span>
                  <strong>{selectedEvent?.totalAssigned ?? 0}</strong>
                </div>
                <div>
                  <span>Presentes</span>
                  <strong>{selectedEvent?.presentCount ?? 0}</strong>
                </div>
                <div>
                  <span>Comparecimento</span>
                  <strong>{attendanceRate}%</strong>
                </div>
              </div>

              <div className="attendance-table">
                <div className="attendance-row attendance-head">
                  <span>Operador</span>
                  <span>Equipe</span>
                  <span>Presenca</span>
                  <span>Status</span>
                  <span>Pontuacao</span>
                  <span>Observacao</span>
                </div>
                {filteredOperators.map((operator) => (
                  <div key={operator.id} className="attendance-row">
                    <div className="attendance-operator">
                      <span className="avatar">
                        {operator.photo ? null : getInitials(operator.name)}
                      </span>
                      <div>
                        <strong>{operator.name}</strong>
                        <span>Operador escalado</span>
                      </div>
                    </div>
                    <span>{operator.team}</span>
                    <label className="attendance-check">
                      <input
                        type="checkbox"
                        checked={operator.present}
                        onChange={() => handleTogglePresence(operator.id)}
                      />
                      <span>{operator.present ? "Sim" : "Nao"}</span>
                    </label>
                    <span className={`tag ${operator.present ? "tag-positive" : "tag-negative"}`}>
                      {operator.present ? "Presente" : "Ausente"}
                    </span>
                    <span>{operator.present ? "100%" : "0%"}</span>
                    <input
                      className="note-input"
                      value={operator.note}
                      onChange={(event) =>
                        setOperators((prev) =>
                          prev.map((item) =>
                            item.id === operator.id ? { ...item, note: event.target.value } : item
                          )
                        )
                      }
                      placeholder="Observacao do operador"
                    />
                  </div>
                ))}
              </div>

              <div className="attendance-footer">
                <textarea
                  className="note-input note-general"
                  value={generalNote}
                  onChange={(event) => setGeneralNote(event.target.value)}
                  placeholder="Observacao geral do evento"
                  rows={3}
                />
                <button className="primary-btn" type="button">
                  Salvar presenca
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="report-single">
            <div className="report-card">
              <h3>Relatorio por periodo</h3>
              <p>Comparecimento geral e ranking de operadores.</p>

              <div className="report-filters compact">
                <div>
                  <label>Equipe</label>
                  <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
                    <option value="ALL">Todas</option>
                    <option value="Alpha">Alpha</option>
                    <option value="Bravo">Bravo</option>
                    <option value="Charlie">Charlie</option>
                  </select>
                </div>
                <div>
                  <label>Periodo</label>
                  <div className="inline-dates">
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(event) => setDateStart(event.target.value)}
                    />
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(event) => setDateEnd(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span>Total eventos</span>
                  <strong>{eventsSeed.length}</strong>
                </div>
                <div className="stat-card">
                  <span>Media comparecimento</span>
                  <strong>78%</strong>
                </div>
                <div className="stat-card">
                  <span>Operadores ativos</span>
                  <strong>{operators.length}</strong>
                </div>
              </div>

              <div className="chart-card">
                <h4>Por evento</h4>
                <div className="bar-chart">
                  {eventsSeed.map((eventItem) => {
                    const percent =
                      eventItem.totalAssigned === 0
                        ? 0
                        : Math.round((eventItem.presentCount / eventItem.totalAssigned) * 100);
                    return (
                      <div key={eventItem.id} className="bar-row">
                        <div>
                          <strong>{eventItem.title}</strong>
                          <span>
                            {eventItem.presentCount}/{eventItem.totalAssigned} presentes
                          </span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="bar-value">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="ranking-grid">
                <div>
                  <h4>Top 5 operadores</h4>
                  <div className="ranking-list">
                    {operatorRanking.top.map((operator) => (
                      <div key={operator.id} className="ranking-item">
                        <span className="avatar small">{getInitials(operator.name)}</span>
                        <div>
                          <strong>{operator.name}</strong>
                          <span>{operator.team}</span>
                        </div>
                        <span className="tag tag-positive">{operator.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4>Bottom 5 operadores</h4>
                  <div className="ranking-list">
                    {operatorRanking.bottom.map((operator) => (
                      <div key={operator.id} className="ranking-item">
                        <span className="avatar small">{getInitials(operator.name)}</span>
                        <div>
                          <strong>{operator.name}</strong>
                          <span>{operator.team}</span>
                        </div>
                        <span className="tag tag-negative">{operator.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
