import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, CalendarDays, Trophy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/")({
  component: AppHome,
});

const newGameSchema = z.object({
  team_name: z.string().trim().min(1, "Nome da equipe é obrigatório").max(80),
  opponent: z.string().trim().min(1, "Adversário é obrigatório").max(80),
  game_date: z.string().min(1),
  competition: z.string().trim().max(80).optional(),
  category: z.string().trim().max(40).optional(),
  goalkeeper_name: z.string().trim().min(1, "Goleiro é obrigatório").max(80),
});

function AppHome() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: games, isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("game_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async (input: z.infer<typeof newGameSchema>) => {
      const { data, error } = await supabase
        .from("games")
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: ["games"] });
      setOpen(false);
      toast.success("Jogo criado!");
      router.navigate({ to: "/app/game/$gameId", params: { gameId: g.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("games").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["games"] });
      toast.success("Jogo removido");
    },
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = newGameSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    createMut.mutate(parsed.data);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Meus jogos</h1>
            <p className="text-sm text-muted-foreground">Crie um novo scout ou continue um já iniciado.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg"><Plus className="mr-2 h-4 w-4" /> Novo jogo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo jogo</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="team_name">Equipe</Label>
                    <Input id="team_name" name="team_name" required />
                  </div>
                  <div>
                    <Label htmlFor="opponent">Adversário</Label>
                    <Input id="opponent" name="opponent" required />
                  </div>
                  <div>
                    <Label htmlFor="game_date">Data</Label>
                    <Input id="game_date" name="game_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input id="category" name="category" placeholder="Adulto, Sub-18..." />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="competition">Competição</Label>
                    <Input id="competition" name="competition" placeholder="Liga Nacional, Amistoso..." />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="goalkeeper_name">Nome do goleiro</Label>
                    <Input id="goalkeeper_name" name="goalkeeper_name" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMut.isPending}>Iniciar Scout</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="col-span-full text-sm text-muted-foreground">Carregando...</p>
          ) : (games?.length ?? 0) === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Você ainda não criou nenhum jogo. Crie o primeiro!</p>
              </CardContent>
            </Card>
          ) : (
            games!.map((g) => (
              <Card key={g.id} className="group transition hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{g.team_name} <span className="text-muted-foreground">vs</span> {g.opponent}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" /> {new Date(g.game_date + "T00:00").toLocaleDateString("pt-BR")}
                    {g.competition ? ` · ${g.competition}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm"><span className="text-muted-foreground">Goleiro:</span> <span className="font-medium">{g.goalkeeper_name}</span></p>
                  {g.category ? <p className="text-xs text-muted-foreground">{g.category}</p> : null}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Button asChild size="sm">
                      <Link to="/app/game/$gameId" params={{ gameId: g.id }}>Abrir scout</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { if (confirm("Excluir este jogo?")) deleteMut.mutate(g.id); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
