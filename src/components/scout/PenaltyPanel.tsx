import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Shot } from "@/lib/scout/stats";
import { ZONES, type Zone } from "@/lib/scout/constants";

export function PenaltyPanel({ shots }: { shots: Shot[] }) {
  const penalties = useMemo(() => shots.filter((s) => s.shot_type === "7m"), [shots]);
  const byPlayer = useMemo(() => {
    const map = new Map<number, { tot: number; gols: number; def: number; hand: string | null; zones: Record<Zone, number> }>();
    for (const s of penalties) {
      if (s.player_number == null) continue;
      const cur = map.get(s.player_number) ?? {
        tot: 0, gols: 0, def: 0, hand: s.dominant_hand,
        zones: Object.fromEntries(ZONES.map((z) => [z, 0])) as Record<Zone, number>,
      };
      cur.tot += 1;
      if (s.result === "gol") cur.gols += 1;
      if (s.result === "defesa") cur.def += 1;
      if (s.dominant_hand) cur.hand = s.dominant_hand;
      if (ZONES.includes(s.zone as Zone)) cur.zones[s.zone as Zone] += 1;
      map.set(s.player_number, cur);
    }
    return Array.from(map.entries()).map(([num, v]) => {
      const fav = (Object.entries(v.zones) as [Zone, number][]).sort((a, b) => b[1] - a[1])[0];
      return {
        numero: num,
        tot: v.tot,
        gols: v.gols,
        def: v.def,
        hand: v.hand,
        zona_pref: fav?.[1] ? fav[0] : "—",
        aproveitamento: ((v.gols / Math.max(v.tot, 1)) * 100).toFixed(0),
      };
    }).sort((a, b) => b.tot - a.tot);
  }, [penalties]);

  return (
    <Card>
      <CardContent className="py-5">
        <h3 className="mb-3 font-display text-lg font-bold text-primary">Cobradores de 7 metros</h3>
        {byPlayer.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Registre arremessos do tipo "7 metros" com o número do jogador para gerar este histórico.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Mão</TableHead>
                <TableHead>Zona preferida</TableHead>
                <TableHead className="text-right">Cobranças</TableHead>
                <TableHead className="text-right">Gols</TableHead>
                <TableHead className="text-right">Defesas</TableHead>
                <TableHead className="text-right">Aprov.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byPlayer.map((p) => (
                <TableRow key={p.numero}>
                  <TableCell className="font-bold">{p.numero}</TableCell>
                  <TableCell className="capitalize">{p.hand ?? "—"}</TableCell>
                  <TableCell className="font-mono">{p.zona_pref}</TableCell>
                  <TableCell className="text-right">{p.tot}</TableCell>
                  <TableCell className="text-right text-destructive">{p.gols}</TableCell>
                  <TableCell className="text-right text-success">{p.def}</TableCell>
                  <TableCell className="text-right">{p.aproveitamento}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
