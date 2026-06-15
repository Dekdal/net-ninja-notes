import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, FileDown, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShotRegister, type ShotDraft } from "@/components/scout/ShotRegister";
import { StatsDashboard } from "@/components/scout/StatsDashboard";
import { PenaltyPanel } from "@/components/scout/PenaltyPanel";
import { Insights } from "@/components/scout/Insights";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoalMap } from "@/components/scout/GoalMap";
import { POSITIONS, RESULTS, ZONES, type Zone } from "@/lib/scout/constants";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { positionLabel, resultLabel, shotTypeLabel } from "@/lib/scout/constants";
import { exportCSV, exportPDF, exportXLSX } from "@/lib/scout/exports";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/game/$gameId")({
  component: GamePage,
});

function GamePage() {
  const { gameId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();

  const { data: game } = useQuery({
    queryKey: ["game", gameId],
    queryFn: async () => {
      const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: shots = [] } = useQuery({
    queryKey: ["shots", gameId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shots")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addShot = useMutation({
    mutationFn: async (draft: ShotDraft) => {
      const { error } = await supabase.from("shots").insert({
        game_id: gameId,
        user_id: user!.id,
        player_number: draft.player_number,
        position: draft.position,
        shot_type: draft.shot_type,
        zone: draft.zone,
        result: draft.result,
        game_time: draft.game_time || null,
        dominant_hand: draft.dominant_hand,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shots", gameId] });
      toast.success("Arremesso registrado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeShot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shots", gameId] }),
  });

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader user={user} />
        <p className="p-8 text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app"><ArrowLeft className="mr-1 h-4 w-4" /> Jogos</Link>
            </Button>
            <h1 className="mt-1 font-display text-2xl font-bold text-primary">
              {game.team_name} <span className="text-muted-foreground">vs</span> {game.opponent}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(game.game_date + "T00:00").toLocaleDateString("pt-BR")}
              {game.competition ? ` · ${game.competition}` : ""}
              {game.category ? ` · ${game.category}` : ""} · Goleiro: <span className="font-medium text-foreground">{game.goalkeeper_name}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV(game, shots)}><FileDown className="mr-1.5 h-4 w-4" />CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exportXLSX(game, shots)}><FileSpreadsheet className="mr-1.5 h-4 w-4" />Excel</Button>
            <Button variant="outline" size="sm" onClick={() => exportPDF(game, shots)}><FileText className="mr-1.5 h-4 w-4" />PDF</Button>
          </div>
        </div>

        <Tabs defaultValue="scout">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
            <TabsTrigger value="scout">Scout</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="penalty">7 metros</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="scout" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <Card>
                <CardContent className="py-5">
                  <h2 className="mb-3 font-display text-lg font-bold text-primary">Registrar arremesso</h2>
                  <ShotRegister onSubmit={(d) => addShot.mutate(d)} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-primary">Cobrança de 7m</h2>
                    <PenaltyDialog onSubmit={(d) => addShot.mutate(d)} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use o registro lateral para incluir mão dominante do cobrador e gerar o histórico específico de penalidades.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="py-5">
                <h2 className="mb-3 font-display text-lg font-bold text-primary">Últimos arremessos</h2>
                {shots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum arremesso registrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tempo</TableHead>
                          <TableHead>Nº</TableHead>
                          <TableHead>Posição</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Zona</TableHead>
                          <TableHead>Resultado</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shots.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-xs">{s.game_time || "—"}</TableCell>
                            <TableCell className="font-bold">{s.player_number ?? "—"}</TableCell>
                            <TableCell>{positionLabel(s.position)}</TableCell>
                            <TableCell>{shotTypeLabel(s.shot_type)}</TableCell>
                            <TableCell className="font-mono">{s.zone}</TableCell>
                            <TableCell>
                              <span className={cn(
                                "rounded px-2 py-0.5 text-xs font-semibold",
                                RESULTS.find((r) => r.value === s.result)?.color,
                              )}>{resultLabel(s.result)}</span>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => removeShot.mutate(s.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-4">
            <StatsDashboard shots={shots} />
          </TabsContent>

          <TabsContent value="penalty" className="mt-4 space-y-4">
            <PenaltyPanel shots={shots} />
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <Insights shots={shots} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function PenaltyDialog({ onSubmit }: { onSubmit: (d: ShotDraft) => void }) {
  const [open, setOpen] = useState(false);
  const [playerNumber, setPlayerNumber] = useState("");
  const [hand, setHand] = useState<"destra" | "canhota">("destra");
  const [zone, setZone] = useState<Zone | null>(null);

  function pick(result: "gol" | "defesa" | "trave" | "fora") {
    if (!zone) return toast.error("Escolha a zona");
    if (!playerNumber) return toast.error("Informe o número do cobrador");
    onSubmit({
      player_number: Number(playerNumber),
      position: "armador_cen",
      shot_type: "7m",
      zone,
      result,
      game_time: "",
      dominant_hand: hand,
    });
    setOpen(false);
    setZone(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Registrar 7m</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Cobrança de 7 metros</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nº do cobrador</Label>
              <Input inputMode="numeric" value={playerNumber}
                onChange={(e) => setPlayerNumber(e.target.value.replace(/\D/g, "").slice(0, 3))} />
            </div>
            <div>
              <Label>Mão dominante</Label>
              <div className="mt-1 flex gap-1.5">
                {(["destra", "canhota"] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHand(h)}
                    className={cn(
                      "flex-1 rounded-md border px-2 py-1.5 text-sm capitalize",
                      hand === h ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                    )}
                  >{h}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Zona escolhida</Label>
            <GoalMap selected={zone} onSelect={setZone} size="sm" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {RESULTS.map((r) => (
              <Button key={r.value} className={cn("h-12", r.color, "hover:opacity-90")} onClick={() => pick(r.value)}>
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
