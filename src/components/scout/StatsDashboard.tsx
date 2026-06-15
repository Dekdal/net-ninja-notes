import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GoalMap } from "./GoalMap";
import { computeStats, statsByShotType, statsByPlayer, heatmapBy, type Shot } from "@/lib/scout/stats";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "primary" | "destructive" | "success" }) {
  const cls = accent === "destructive" ? "text-destructive" : accent === "success" ? "text-success" : "text-primary";
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-1 font-display text-3xl font-bold ${cls}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function StatsDashboard({ shots }: { shots: Shot[] }) {
  const stats = computeStats(shots);
  const bySit = statsByShotType(shots);
  const byPlayer = statsByPlayer(shots);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Arremessos" value={String(stats.total)} accent="primary" />
        <StatCard label="Defesas" value={String(stats.defesas)} accent="success" />
        <StatCard label="Gols sofridos" value={String(stats.gols)} accent="destructive" />
        <StatCard label="Eficiência" value={`${stats.eficiencia.toFixed(1)}%`} accent="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="py-5">
            <h3 className="mb-3 font-display text-lg font-bold text-primary">Eficiência por situação</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bySit}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                />
                <Bar dataKey="defesas" stackId="a" fill="var(--color-success)" name="Defesas" />
                <Bar dataKey="gols" stackId="a" fill="var(--color-destructive)" name="Gols" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5">
            <h3 className="mb-3 font-display text-lg font-bold text-primary">Estatísticas por situação</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Arr.</TableHead>
                  <TableHead className="text-right">Def.</TableHead>
                  <TableHead className="text-right">Efic.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bySit.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right">{r.total}</TableCell>
                    <TableCell className="text-right">{r.defesas}</TableCell>
                    <TableCell className="text-right">{r.eficiencia.toFixed(0)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <h3 className="mb-3 font-display text-lg font-bold text-primary">Onde mais finalizam</h3>
            <GoalMap heat={heatmapBy(shots)} showCounts />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <h3 className="mb-3 font-display text-lg font-bold text-primary">Onde mais defende</h3>
            <GoalMap heat={heatmapBy(shots, (s) => s.result === "defesa")} showCounts />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <h3 className="mb-3 font-display text-lg font-bold text-primary">Onde sofre gols</h3>
            <GoalMap heat={heatmapBy(shots, (s) => s.result === "gol")} showCounts />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-5">
          <h3 className="mb-3 font-display text-lg font-bold text-primary">Estatísticas por jogador</h3>
          {byPlayer.length === 0 ? (
            <p className="text-sm text-muted-foreground">Registre arremessos com nº do jogador para ver esta tabela.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead className="text-right">Arremessos</TableHead>
                  <TableHead className="text-right">Gols</TableHead>
                  <TableHead className="text-right">Defesas</TableHead>
                  <TableHead className="text-right">Eficiência do GK</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byPlayer.map((r) => (
                  <TableRow key={r.numero}>
                    <TableCell className="font-bold">{r.numero}</TableCell>
                    <TableCell className="text-right">{r.arremessos}</TableCell>
                    <TableCell className="text-right text-destructive">{r.gols}</TableCell>
                    <TableCell className="text-right text-success">{r.defesas}</TableCell>
                    <TableCell className="text-right">
                      {((r.defesas / Math.max(r.arremessos, 1)) * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
