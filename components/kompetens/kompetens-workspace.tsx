"use client";

import { useEffect, useMemo, useState } from "react";

import { InviteForm } from "@/components/org/invite-form";
import { useOrgSession } from "@/components/providers/org-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABEL } from "@/lib/features";
import {
  addCompetence,
  addExtraPerson,
  competenceTableMessage,
  loadCompetence,
  removeCompetence,
  removeExtraPerson,
  setLevel,
  type Competence,
  type CompetenceLevel,
  type ExtraPerson,
  type LevelCell,
} from "@/lib/kompetens/persist";
import { loadOrgMembers, type OrgMember } from "@/lib/org/members";

interface RowPerson {
  key: string;
  name: string;
  email: string;
  role: string;
  extra: boolean;
}

const LEVELS: { id: CompetenceLevel | ""; label: string }[] = [
  { id: "", label: "–" },
  { id: "missing", label: "Saknas" },
  { id: "training", label: "Utbildas" },
  { id: "ok", label: "Kan" },
];

export function KompetensWorkspace() {
  const { session } = useOrgSession();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [skills, setSkills] = useState<Competence[]>([]);
  const [extras, setExtras] = useState<ExtraPerson[]>([]);
  const [levels, setLevels] = useState<LevelCell[]>([]);
  const [skillName, setSkillName] = useState("");
  const [personName, setPersonName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canEdit = session?.role !== "viewer";
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (!session?.organizationId) return;
    const organizationId = session.organizationId;
    void loadOrgMembers(organizationId).then(setMembers).catch(() => setMembers([]));
    void loadCompetence(organizationId)
      .then((data) => {
        setSkills(data.skills);
        setExtras(data.extras);
        setLevels(data.levels);
        setError(null);
      })
      .catch((err) => setError(competenceTableMessage(err)));
  }, [session?.organizationId]);

  const people = useMemo<RowPerson[]>(() => {
    const fromMembers = members.map((person) => ({
      key: person.userId,
      name: person.name,
      email: person.email,
      role: ROLE_LABEL[person.role],
      extra: false,
    }));
    const memberKeys = new Set(fromMembers.map((person) => person.key));
    const fromExtras = extras
      .filter((person) => !memberKeys.has(person.personKey))
      .map((person) => ({
        key: person.personKey,
        name: person.name,
        email: "",
        role: "Utan konto",
        extra: true,
      }));
    return [...fromMembers, ...fromExtras];
  }, [members, extras]);

  function levelFor(competenceId: string, personKey: string) {
    return levels.find((cell) => cell.competenceId === competenceId && cell.personKey === personKey)?.level ?? "";
  }

  async function onAddSkill() {
    if (!session?.organizationId || !skillName.trim()) return;
    setBusy(true);
    try {
      const row = await addCompetence(session.organizationId, skillName.trim());
      setSkills((current) => [...current, row]);
      setSkillName("");
      setError(null);
    } catch (err) {
      setError(competenceTableMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onAddPerson() {
    if (!session?.organizationId || !personName.trim()) return;
    setBusy(true);
    try {
      const row = await addExtraPerson(session.organizationId, personName.trim());
      setExtras((current) => [...current, row]);
      setPersonName("");
      setError(null);
    } catch (err) {
      setError(competenceTableMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onLevel(competenceId: string, personKey: string, level: CompetenceLevel | "") {
    if (!session?.organizationId) return;
    const previous = levels;
    setLevels((current) => {
      const rest = current.filter((cell) => !(cell.competenceId === competenceId && cell.personKey === personKey));
      return level ? [...rest, { competenceId, personKey, level }] : rest;
    });
    try {
      await setLevel({ organizationId: session.organizationId, competenceId, personKey, level });
      setError(null);
    } catch (err) {
      setLevels(previous);
      setError(competenceTableMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        Här ser du vem som kan vad. Lägg till en kompetens, till exempel Truckkort. Välj sedan Saknas, Utbildas eller Kan.
        Personer med konto kommer från inbjudan. Du kan också lägga till någon utan konto.
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {isAdmin && session?.organizationId ? (
        <section className="rounded-2xl border bg-card p-5 shadow-token-sm" data-tour="bjud-in-personal">
          <h2 className="text-base font-bold">Bjud in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Personen får ett mejl och kan logga in.</p>
          <div className="mt-4">
            <InviteForm
              organizationId={session.organizationId}
              organizationName={session.organizationName}
              userId={session.userId}
            />
          </div>
        </section>
      ) : null}

      {canEdit ? (
        <section className="grid gap-4 md:grid-cols-2">
          <form
            className="flex flex-col gap-2 rounded-2xl border bg-card p-5 shadow-token-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void onAddSkill();
            }}
          >
            <h2 className="text-base font-bold">Ny kompetens</h2>
            <p className="text-sm text-muted-foreground">Ett krav ni har. Till exempel Intern revision eller Heta arbeten.</p>
            <div className="flex gap-2">
              <Input
                aria-label="Namn på kompetens"
                onChange={(event) => setSkillName(event.target.value)}
                placeholder="Till exempel Truckkort"
                value={skillName}
              />
              <Button disabled={busy || !skillName.trim()} type="submit">
                Lägg till
              </Button>
            </div>
          </form>
          <form
            className="flex flex-col gap-2 rounded-2xl border bg-card p-5 shadow-token-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void onAddPerson();
            }}
          >
            <h2 className="text-base font-bold">Person utan konto</h2>
            <p className="text-sm text-muted-foreground">Någon som jobbar här men inte loggar in.</p>
            <div className="flex gap-2">
              <Input
                aria-label="Namn"
                onChange={(event) => setPersonName(event.target.value)}
                placeholder="Namn"
                value={personName}
              />
              <Button disabled={busy || !personName.trim()} type="submit">
                Lägg till
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="overflow-x-auto rounded-2xl border bg-card shadow-token-sm" data-tour="matris">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="sticky left-0 bg-card px-4 py-3 font-semibold">Person</th>
              {skills.map((skill) => (
                <th className="px-3 py-3 font-semibold" key={skill.id}>
                  <div className="flex items-center gap-2">
                    <span>{skill.name}</span>
                    {canEdit ? (
                      <button
                        className="text-xs text-muted-foreground underline"
                        onClick={() => {
                          void removeCompetence(skill.id)
                            .then(() => {
                              setSkills((current) => current.filter((item) => item.id !== skill.id));
                              setLevels((current) => current.filter((cell) => cell.competenceId !== skill.id));
                            })
                            .catch((err) => setError(competenceTableMessage(err)));
                        }}
                        type="button"
                      >
                        Ta bort
                      </button>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={Math.max(1, skills.length + 1)}>
                  Ingen personal ännu. Bjud in någon, eller lägg till ett namn.
                </td>
              </tr>
            ) : (
              people.map((person) => (
                <tr className="border-b last:border-0" key={person.key}>
                  <th className="sticky left-0 bg-card px-4 py-3 text-left font-medium">
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {person.name}
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{person.role}</span>
                      </span>
                      {person.extra && canEdit && session?.organizationId ? (
                        <button
                          className="text-xs text-muted-foreground underline"
                          onClick={() => {
                            const organizationId = session.organizationId;
                            if (!organizationId) return;
                            void removeExtraPerson(organizationId, person.key)
                              .then(() => setExtras((current) => current.filter((item) => item.personKey !== person.key)))
                              .catch((err) => setError(competenceTableMessage(err)));
                          }}
                          type="button"
                        >
                          Ta bort
                        </button>
                      ) : null}
                    </div>
                  </th>
                  {skills.map((skill) => (
                    <td className="px-3 py-2" key={skill.id}>
                      <select
                        aria-label={`${person.name} ${skill.name}`}
                        className="h-9 rounded-lg border bg-background px-2"
                        disabled={!canEdit}
                        onChange={(event) => void onLevel(skill.id, person.key, event.target.value as CompetenceLevel | "")}
                        value={levelFor(skill.id, person.key)}
                      >
                        {LEVELS.map((item) => (
                          <option key={item.id || "empty"} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {skills.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted-foreground">Ingen kompetens ännu. Lägg till den första ovan.</p>
        ) : null}
      </section>
    </div>
  );
}
