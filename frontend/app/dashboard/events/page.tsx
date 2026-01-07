"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "../../components/DashboardShell";
import {
  createEvent,
  deleteEvent,
  EventItem,
  fetchEvents,
  fetchSession,
  updateEvent
} from "../../lib/api";

type EventForm = {
  id?: string;
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
};

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

const pad = (value: number) => value.toString().padStart(2, "0");

const toDateKey = (value: Date) =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

const toLocalInputValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const toIsoFromInput = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - day);
  next.setHours(0, 0, 0, 0);
  return next;
};

const startOfMonth = (date: Date) => {
  const next = new Date(date.getFullYear(), date.getMonth(), 1);
  next.setHours(0, 0, 0, 0);
  return next;
};

const startOfYear = (date: Date) => {
  const next = new Date(date.getFullYear(), 0, 1);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfYear = (date: Date) => {
  const next = new Date(date.getFullYear(), 11, 31);
  next.setHours(23, 59, 59, 999);
  return next;
};

const createEmptyForm = (): EventForm => ({
  title: "",
  description: "",
  location: "",
  startAt: "",
  endAt: ""
});

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [view, setView] = useState<"week" | "month" | "year">("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [formState, setFormState] = useState<EventForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSession()
      .then((session) => {
        if (!session.mfaEnabled) {
          router.push("/mfa");
          return;
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          router.push("/");
          return;
        }
        setError("Falha ao carregar sessao.");
      });
  }, [router]);

  const range = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(cursor);
      const end = addDays(start, 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (view === "year") {
      return { start: startOfYear(cursor), end: endOfYear(cursor) };
    }

    const start = startOfWeek(startOfMonth(cursor));
    const end = addDays(start, 41);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [cursor, view]);

  useEffect(() => {
    fetchEvents(range.start.toISOString(), range.end.toISOString())
      .then(setEvents)
      .catch((err) => {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          router.push("/");
          return;
        }
        setError("Falha ao carregar eventos.");
      });
  }, [range.start, range.end, router]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    const rangeStart = range.start;
    const rangeEnd = range.end;

    events.forEach((event) => {
      const start = new Date(event.startAt);
      const end = new Date(event.endAt);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return;
      }

      const current = new Date(start);
      current.setHours(0, 0, 0, 0);
      const last = new Date(end);
      last.setHours(0, 0, 0, 0);

      while (current <= last) {
        if (current >= rangeStart && current <= rangeEnd) {
          const key = toDateKey(current);
          if (!map[key]) {
            map[key] = [];
          }
          map[key].push(event);
        }
        current.setDate(current.getDate() + 1);
      }
    });

    Object.values(map).forEach((items) => {
      items.sort((a, b) => a.startAt.localeCompare(b.startAt));
    });

    return map;
  }, [events, range.start, range.end]);

  const monthDays = useMemo(() => {
    const days: Date[] = [];
    let current = new Date(range.start);
    while (current <= range.end) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    return days;
  }, [range.start, range.end]);

  const yearStats = useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0);
    events.forEach((event) => {
      const date = new Date(event.startAt);
      if (!Number.isNaN(date.getTime())) {
        counts[date.getMonth()] += 1;
      }
    });
    return counts;
  }, [events]);

  const handleNavigate = (direction: number) => {
    setCursor((prev) => {
      const next = new Date(prev);
      if (view === "week") {
        next.setDate(next.getDate() + direction * 7);
      } else if (view === "year") {
        next.setFullYear(next.getFullYear() + direction);
      } else {
        next.setMonth(next.getMonth() + direction);
      }
      return next;
    });
  };

  const handleCreate = (date?: Date) => {
    const base = date ? new Date(date) : new Date();
    base.setHours(9, 0, 0, 0);
    const end = new Date(base);
    end.setHours(10, 0, 0, 0);

    setMode("create");
    setFormState({
      ...createEmptyForm(),
      startAt: toLocalInputValue(base.toISOString()),
      endAt: toLocalInputValue(end.toISOString())
    });
    setModalOpen(true);
  };

  const handleSelect = (event: EventItem) => {
    setMode("edit");
    setFormState({
      id: event.id,
      title: event.title,
      description: event.description ?? "",
      location: event.location ?? "",
      startAt: toLocalInputValue(event.startAt),
      endAt: toLocalInputValue(event.endAt)
    });
    setModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState) {
      return;
    }

    const startAt = toIsoFromInput(formState.startAt);
    const endAt = toIsoFromInput(formState.endAt);

    if (!startAt || !endAt) {
      setError("Data ou horario invalido.");
      return;
    }

    if (startAt >= endAt) {
      setError("Inicio deve ser antes do fim.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (mode === "create") {
        const created = await createEvent({
          title: formState.title,
          description: formState.description || null,
          location: formState.location || null,
          startAt,
          endAt
        });
        setEvents((prev) => [...prev, created]);
      } else if (formState.id) {
        const updated = await updateEvent(formState.id, {
          title: formState.title,
          description: formState.description || null,
          location: formState.location || null,
          startAt,
          endAt
        });
        setEvents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      }

      setModalOpen(false);
      setFormState(null);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        router.push("/");
        return;
      }
      setError(mode === "create" ? "Falha ao criar evento." : "Falha ao atualizar evento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formState?.id) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteEvent(formState.id);
      setEvents((prev) => prev.filter((item) => item.id !== formState.id));
      setModalOpen(false);
      setFormState(null);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        router.push("/");
        return;
      }
      setError("Falha ao remover evento.");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormState(null);
  };

  const rangeLabel = useMemo(() => {
    if (view === "year") {
      return cursor.getFullYear().toString();
    }
    if (view === "week") {
      return `${range.start.toLocaleDateString("pt-BR")} - ${range.end.toLocaleDateString("pt-BR")}`;
    }
    return cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, [cursor, range.start, range.end, view]);

  const content = (
    <DashboardShell title="Painel Administrativo" subtitle="Calendario de Eventos">
      <div className="dashboard-body">
        <div className="page-header">
          <div>
            <h1>Calendario de Eventos</h1>
            <p>Visualize os eventos por semana, mes ou ano</p>
          </div>
          <button className="primary-btn" type="button" onClick={() => handleCreate()}>
            + Novo Evento
          </button>
        </div>

        <div className="calendar-toolbar">
          <div className="calendar-nav">
            <button className="icon-btn" type="button" onClick={() => handleNavigate(-1)}>
              -
            </button>
            <span>{rangeLabel}</span>
            <button className="icon-btn" type="button" onClick={() => handleNavigate(1)}>
              -
            </button>
          </div>
          <div className="calendar-view">
            <button
              className={`view-btn ${view === "week" ? "active" : ""}`}
              type="button"
              onClick={() => setView("week")}
            >
              Semana
            </button>
            <button
              className={`view-btn ${view === "month" ? "active" : ""}`}
              type="button"
              onClick={() => setView("month")}
            >
              Mes
            </button>
            <button
              className={`view-btn ${view === "year" ? "active" : ""}`}
              type="button"
              onClick={() => setView("year")}
            >
              Ano
            </button>
          </div>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        {view !== "year" ? (
          <div className="calendar-grid">
            <div className="calendar-week">
              {weekDays.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="calendar-days">
              {monthDays.map((day) => {
                const key = toDateKey(day);
                const items = eventsByDay[key] ?? [];
                const isCurrentMonth = day.getMonth() === cursor.getMonth();
                return (
                  <div
                    key={key}
                    className={`calendar-day ${isCurrentMonth ? "" : "muted"}`}
                    onDoubleClick={() => handleCreate(day)}
                  >
                    <div className="day-header">
                      <span>{pad(day.getDate())}</span>
                    </div>
                    <div className="day-events">
                      {items.slice(0, 3).map((eventItem) => (
                        <button
                          key={eventItem.id}
                          type="button"
                          className="event-chip"
                          onClick={() => handleSelect(eventItem)}
                        >
                          {new Date(eventItem.startAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                          <span>{eventItem.title}</span>
                        </button>
                      ))}
                      {items.length > 3 ? (
                        <span className="more-events">+{items.length - 3}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="year-grid">
            {Array.from({ length: 12 }).map((_, index) => {
              const label = new Date(cursor.getFullYear(), index, 1).toLocaleDateString("pt-BR", {
                month: "long"
              });
              return (
                <div key={label} className="year-card">
                  <strong>{label}</strong>
                  <span>{yearStats[index]} eventos</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && formState ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <button className="modal-close" type="button" onClick={handleCloseModal}>
              Fechar
            </button>
            <h3>{mode === "create" ? "Novo Evento" : "Detalhes do Evento"}</h3>
            <form className="form-grid" onSubmit={handleSave}>
              <div>
                <label>Titulo</label>
                <input
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Local</label>
                <input
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                />
              </div>
              <div>
                <label>Inicio</label>
                <input
                  type="datetime-local"
                  value={formState.startAt}
                  onChange={(e) => setFormState({ ...formState, startAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Fim</label>
                <input
                  type="datetime-local"
                  value={formState.endAt}
                  onChange={(e) => setFormState({ ...formState, endAt: e.target.value })}
                  required
                />
              </div>
              <div className="form-span">
                <label>Descricao</label>
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                {mode === "edit" ? (
                  <button type="button" className="ghost-btn" onClick={handleDelete} disabled={saving}>
                    Remover
                  </button>
                ) : null}
                <button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : mode === "create" ? "Cadastrar" : "Salvar alteracoes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );

  return content;
}
