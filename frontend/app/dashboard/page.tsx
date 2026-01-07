"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "../components/DashboardShell";
import {
  createCredentials,
  createUser,
  fetchSession,
  fetchUserById,
  fetchUsers,
  updateUser
} from "../lib/api";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  motherName: string;
  fatherName: string;
  permissionLevel: string;
  combatClass: string;
  phone: string;
  emergencyContactName: string;
  emergencyPhone: string;
  bloodType: string;
  birthDate: string;
  hasAllergy: boolean;
  allergyDetails: string | null;
};

type UserForm = {
  id?: string;
  firstName: string;
  lastName: string;
  motherName: string;
  fatherName: string;
  permissionLevel: string;
  combatClass: string;
  phone: string;
  emergencyContactName: string;
  emergencyPhone: string;
  bloodType: string;
  birthDate: string;
  hasAllergy: boolean;
  allergyDetails: string | null;
};

const combatClasses = ["ASSAULT", "SNIPER", "SUPPRESSOR", "MED", "ENG", "COM"];
const permissionLevels = ["ALTO-COMANDO", "COMANDO", "ADMIN", "BASE", "RECRUTA"];
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const createEmptyForm = (): UserForm => ({
  firstName: "",
  lastName: "",
  motherName: "",
  fatherName: "",
  permissionLevel: "RECRUTA",
  combatClass: "ASSAULT",
  phone: "",
  emergencyContactName: "",
  emergencyPhone: "",
  bloodType: "O+",
  birthDate: "",
  hasAllergy: false,
  allergyDetails: ""
});

const getInitials = (user: { firstName: string; lastName: string }) => {
  const first = user.firstName.trim().charAt(0) || "?";
  const last = user.lastName.trim().charAt(0) || "";
  return `${first}${last}`.toUpperCase();
};

export default function DashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [formState, setFormState] = useState<UserForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("edit");
  const [search, setSearch] = useState("");
  const [filterPermission, setFilterPermission] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    fetchSession()
      .then((session) => {
        if (!session.mfaEnabled) {
          router.push("/mfa");
          return null;
        }
        return fetchUsers();
      })
      .then((data) => {
        if (data) {
          setUsers(data);
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          router.push("/");
          return;
        }
        setError("Falha ao carregar usuarios.");
      });
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const map: Record<string, string> = {};
    users.forEach((user) => {
      const stored = localStorage.getItem(`user_avatar_${user.id}`);
      if (stored) {
        map[user.id] = stored;
      }
    });
    setAvatarMap(map);
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        term.length === 0 ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
        user.permissionLevel.toLowerCase().includes(term) ||
        user.combatClass.toLowerCase().includes(term) ||
        user.phone.toLowerCase().includes(term);

      const matchesPermission =
        filterPermission === "ALL" || user.permissionLevel === filterPermission;
      const matchesClass = filterClass === "ALL" || user.combatClass === filterClass;

      return matchesSearch && matchesPermission && matchesClass;
    });
  }, [users, search, filterPermission, filterClass]);

  const stats = useMemo(() => {
    const total = users.length;
    const countByPermission = permissionLevels.reduce<Record<string, number>>((acc, level) => {
      acc[level] = users.filter((user) => user.permissionLevel === level).length;
      return acc;
    }, {});

    return {
      total,
      alto: countByPermission["ALTO-COMANDO"],
      comando: countByPermission["COMANDO"],
      admin: countByPermission["ADMIN"],
      base: countByPermission["BASE"],
      recruta: countByPermission["RECRUTA"]
    };
  }, [users]);

  const handleSelect = async (userId: string) => {
    try {
      const data = await fetchUserById(userId);
      setMode("edit");
      setFormState(data);
      setAvatarPreview(avatarMap[data.id] ?? null);
      setPendingAvatar(null);
      setCredentials({ email: "", password: "", confirmPassword: "" });
      setIsModalOpen(true);
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        router.push("/");
        return;
      }
      setError("Falha ao carregar detalhes.");
    }
  };

  const handleCreate = () => {
    setMode("create");
    setFormState(createEmptyForm());
    setAvatarPreview(null);
    setPendingAvatar(null);
    setCredentials({ email: "", password: "", confirmPassword: "" });
    setIsModalOpen(true);
  };

  const handleChange = (field: keyof UserForm, value: string | boolean | null) => {
    if (!formState) {
      return;
    }

    setFormState({ ...formState, [field]: value } as UserForm);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        return;
      }

      setAvatarPreview(result);

      if (mode === "edit" && formState?.id) {
        localStorage.setItem(`user_avatar_${formState.id}`, result);
        setAvatarMap((prev) => ({ ...prev, [formState.id as string]: result }));
      } else {
        setPendingAvatar(result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState) {
      return;
    }

    if (formState.hasAllergy && !formState.allergyDetails) {
      setError("Detalhe de alergia obrigatorio.");
      return;
    }

    if (mode === "create") {
      if (!credentials.email || !credentials.password || !credentials.confirmPassword) {
        setError("Informe email e senha do usuario.");
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formState,
        allergyDetails: formState.hasAllergy ? formState.allergyDetails : null
      };

      if (mode === "create") {
        const created = await createUser(payload);
        setUsers((prev) => [created, ...prev]);

        if (pendingAvatar) {
          localStorage.setItem(`user_avatar_${created.id}`, pendingAvatar);
          setAvatarMap((prev) => ({ ...prev, [created.id]: pendingAvatar }));
        }

        try {
          await createCredentials({
            userId: created.id,
            email: credentials.email,
            password: credentials.password,
            confirmPassword: credentials.confirmPassword
          });
        } catch (err) {
          setMode("edit");
          setFormState(created);
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Falha ao criar credenciais.");
          }
          return;
        }
      } else {
        if (!formState.id) {
          throw new Error("Usuario invalido.");
        }

        const { id, ...data } = payload;
        const updated = await updateUser(formState.id, data);
        setUsers((prev) => prev.map((user) => (user.id === formState.id ? updated : user)));

        if (credentials.email || credentials.password || credentials.confirmPassword) {
          await createCredentials({
            userId: formState.id,
            email: credentials.email,
            password: credentials.password,
            confirmPassword: credentials.confirmPassword
          });
        }
      }

      setIsModalOpen(false);
      setFormState(null);
      setAvatarPreview(null);
      setPendingAvatar(null);
      setCredentials({ email: "", password: "", confirmPassword: "" });
    } catch (err) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        router.push("/");
        return;
      }
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(mode === "create" ? "Falha ao criar usuario." : "Falha ao atualizar usuario.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormState(null);
    setAvatarPreview(null);
    setPendingAvatar(null);
    setCredentials({ email: "", password: "", confirmPassword: "" });
  };

  return (
    <DashboardShell title="Painel Administrativo" subtitle="Gestao de Usuarios">
      <div className="dashboard-body">
        <div className="page-header">
          <div>
            <h1>Gestao de Usuarios</h1>
            <p>Gerencie os usuarios do sistema</p>
          </div>
          <button className="primary-btn" type="button" onClick={handleCreate}>
            + Novo Usuario
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Total de Usuarios</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="stat-card">
            <span>Alto Comando</span>
            <strong>{stats.alto}</strong>
          </div>
          <div className="stat-card">
            <span>Comando</span>
            <strong>{stats.comando}</strong>
          </div>
          <div className="stat-card">
            <span>Admins</span>
            <strong>{stats.admin}</strong>
          </div>
          <div className="stat-card">
            <span>Base</span>
            <strong>{stats.base}</strong>
          </div>
          <div className="stat-card">
            <span>Recrutas</span>
            <strong>{stats.recruta}</strong>
          </div>
        </div>

        <div className="list-card">
          <div className="list-header">
            <div>
              <h3>Lista de Usuarios</h3>
              <p>Gerencie os usuarios do sistema</p>
            </div>
          </div>
          <div className="list-filters">
            <input
              className="filter-input"
              placeholder="Buscar usuarios"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="filter-input"
              value={filterPermission}
              onChange={(event) => setFilterPermission(event.target.value)}
            >
              <option value="ALL">Todas permissoes</option>
              {permissionLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <select
              className="filter-input"
              value={filterClass}
              onChange={(event) => setFilterClass(event.target.value)}
            >
              <option value="ALL">Todas classes</option>
              {combatClasses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <div className="table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Classe</th>
                  <th>Permissao</th>
                  <th>Contato</th>
                  <th>Emergencia</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      Nenhum usuario encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <span
                            className="avatar"
                            style={
                              avatarMap[user.id]
                                ? { backgroundImage: `url(${avatarMap[user.id]})` }
                                : undefined
                            }
                          >
                            {!avatarMap[user.id] ? getInitials(user) : null}
                          </span>
                          <div>
                            <strong>{user.firstName} {user.lastName}</strong>
                            <span>{user.permissionLevel} | {user.combatClass}</span>
                          </div>
                        </div>
                      </td>
                      <td>{user.combatClass}</td>
                      <td>
                        <span className="tag">{user.permissionLevel}</span>
                      </td>
                      <td>{user.phone}</td>
                      <td>{user.emergencyContactName}</td>
                      <td>
                        <button
                          className="action-btn"
                          type="button"
                          onClick={() => handleSelect(user.id)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && formState ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <button className="modal-close" type="button" onClick={handleCloseModal}>
              Fechar
            </button>
            <h3>{mode === "create" ? "Novo Usuario" : "Detalhes do Usuario"}</h3>
            <form className="form-grid" onSubmit={handleSave}>
              <div className="avatar-uploader">
                <div
                  className="avatar large"
                  style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : undefined}
                >
                  {!avatarPreview
                    ? getInitials({
                      firstName: formState.firstName || "U",
                      lastName: formState.lastName || "S"
                    })
                    : null}
                </div>
                <div>
                  <label>Imagem do usuario</label>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} />
                </div>
              </div>
              <div>
                <label>Nome</label>
                <input
                  value={formState.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Sobrenome</label>
                <input
                  value={formState.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Nome da mae</label>
                <input
                  value={formState.motherName}
                  onChange={(e) => handleChange("motherName", e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Nome do pai</label>
                <input
                  value={formState.fatherName}
                  onChange={(e) => handleChange("fatherName", e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Classe</label>
                <select
                  value={formState.combatClass}
                  onChange={(e) => handleChange("combatClass", e.target.value)}
                >
                  {combatClasses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Nascimento</label>
                <input
                  type="date"
                  value={formState.birthDate}
                  onChange={(e) => handleChange("birthDate", e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Tipo sanguineo</label>
                <select
                  value={formState.bloodType}
                  onChange={(e) => handleChange("bloodType", e.target.value)}
                >
                  {bloodTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Possui alergia</label>
                <select
                  value={formState.hasAllergy ? "true" : "false"}
                  onChange={(e) => handleChange("hasAllergy", e.target.value === "true")}
                >
                  <option value="false">Nao</option>
                  <option value="true">Sim</option>
                </select>
              </div>
              <div>
                <label>Detalhes alergia</label>
                <input
                  value={formState.allergyDetails ?? ""}
                  onChange={(e) => handleChange("allergyDetails", e.target.value)}
                  disabled={!formState.hasAllergy}
                  required={formState.hasAllergy}
                />
              </div>
              <div>
                <label>Contato</label>
                <input
                  value={formState.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Contato emergencia</label>
                <input
                  value={formState.emergencyPhone}
                  onChange={(e) => handleChange("emergencyPhone", e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Nome emergencia</label>
                <input
                  value={formState.emergencyContactName}
                  onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Permissao</label>
                <select
                  value={formState.permissionLevel}
                  onChange={(e) => handleChange("permissionLevel", e.target.value)}
                >
                  {permissionLevels.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-span">
                <h4 className="form-section-title">Credenciais de acesso</h4>
              </div>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  required={mode === "create"}
                />
              </div>
              <div>
                <label>Senha</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required={mode === "create"}
                />
              </div>
              <div>
                <label>Confirmar senha</label>
                <input
                  type="password"
                  value={credentials.confirmPassword}
                  onChange={(e) =>
                    setCredentials({ ...credentials, confirmPassword: e.target.value })
                  }
                  required={mode === "create"}
                />
              </div>
              <div className="form-actions">
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
}
