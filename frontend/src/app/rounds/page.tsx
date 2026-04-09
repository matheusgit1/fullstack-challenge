// app/rounds/page.tsx
// import { RoundsList } from "@/components/rounds-list";

import { RoundsList } from "@/components/game/rounds-list";
import { Header } from "@/components/layout/header";
import { RoundHistory } from "@/types/games";

// Função para buscar dados do lado do servidor (opcional)
async function getRounds(): Promise<RoundHistory[]> {
  // Se você estiver usando Next.js com App Router, pode fazer fetch aqui
  // ou passar vazio e deixar o cliente buscar
  return [
    {
      roundId: "37b9be25-5ede-41c7-82e4-f6c56461dbb9",
      crashPoint: "secret",
      serverSeedHash:
        "cd17a429994857a39104934df978d5d5068feea5320d9f9daf6b56d2da503b03",
      endedAt: "2026-04-09T02:34:52.968Z",
      status: "running",
      multiplier: 9.13,
      bettingStartedAt: "2026-04-09T02:34:37.968Z",
      bettingEndsAt: "2026-04-09T02:34:52.968Z",
      roundStartedAt: "2026-04-09T02:35:07.966Z",
      roundCrashedAt: "2026-04-09T03:34:09.672Z",
      serverSeed:
        "3c4eef37b4436611f15548e6f1e4971bcc3c865c59875eb37b685d23ee076ccf",
      clientSeed: "jungle_1775702077959",
      nonce: 0,
      createdAt: "2026-04-09T02:34:37.970Z",
      updatedAt: "2026-04-09T02:49:13.957Z",
      bets: [],
    },
    {
      roundId: "37a4cf5b-cb23-4f14-b1da-2cd71b5aab99",
      crashPoint: 1.05,
      serverSeedHash:
        "5e0ad65f359f533655193e6f4a43530121dd6c8c20eb10d07ad870b7e27b877f",
      endedAt: "2026-04-09T02:33:22.906Z",
      status: "crashed",
      multiplier: 1.05,
      bettingStartedAt: "2026-04-09T02:33:07.906Z",
      bettingEndsAt: "2026-04-09T02:33:22.906Z",
      roundStartedAt: "2026-04-09T02:33:37.905Z",
      roundCrashedAt: "2026-04-09T02:34:22.972Z",
      serverSeed:
        "ce9f4f2ae48d1806e470ee8df6d3146f33a68948329a213c9981d7b5b66ce658",
      clientSeed: "jungle_1775701987894",
      nonce: 0,
      createdAt: "2026-04-09T02:33:07.905Z",
      updatedAt: "2026-04-09T02:34:11.616Z",
      bets: [],
    },
    {
      roundId: "3c458e48-6342-4a38-8f67-4930db82f275",
      crashPoint: 1.61,
      serverSeedHash:
        "f6f602e3886a7f10f4f9afe89d51589e05ae28e476b093a9969c4da85af6c316",
      endedAt: "2026-04-09T02:24:52.605Z",
      status: "crashed",
      multiplier: 1.61,
      bettingStartedAt: "2026-04-09T02:24:37.605Z",
      bettingEndsAt: "2026-04-09T02:24:52.605Z",
      roundStartedAt: "2026-04-09T02:25:07.551Z",
      roundCrashedAt: "2026-04-09T02:32:52.922Z",
      serverSeed:
        "1564f89ffc19f1eb93db7cfec821039cecd9297ce32d0ae9404aeb7cf4da2a93",
      clientSeed: "jungle_1775701477549",
      nonce: 0,
      createdAt: "2026-04-09T02:24:37.608Z",
      updatedAt: "2026-04-09T02:32:52.935Z",
      bets: [],
    },
    {
      roundId: "38d62be3-5720-473a-91ce-a33b77cd23d6",
      crashPoint: 15.59,
      serverSeedHash:
        "91c4d5ed38e83c3c6ec900d02e975d59d7f4088f2e8b004a33941ef226d3e6ad",
      endedAt: "2026-04-09T01:38:23.829Z",
      status: "crashed",
      multiplier: 15.59,
      bettingStartedAt: "2026-04-09T01:38:08.829Z",
      bettingEndsAt: "2026-04-09T01:38:23.829Z",
      roundStartedAt: "2026-04-09T01:38:38.826Z",
      roundCrashedAt: "2026-04-09T02:24:22.610Z",
      serverSeed:
        "b92928b482b153f8e5de34ffba9b5e1e694fc1fce60b5d8538aa2bcade1cdf51",
      clientSeed: "jungle_1775698688799",
      nonce: 0,
      createdAt: "2026-04-09T01:38:08.830Z",
      updatedAt: "2026-04-09T02:24:22.623Z",
      bets: [],
    },
    {
      roundId: "960f2630-7a15-4186-ac1f-7b01d6f5e5ca",
      crashPoint: 13.5,
      serverSeedHash:
        "69c06187da524f23773267d2eb8c9541289a7746e648e15c427d2acdd9b9b870",
      endedAt: "2026-04-09T00:53:41.978Z",
      status: "crashed",
      multiplier: 12.42,
      bettingStartedAt: "2026-04-09T00:53:26.978Z",
      bettingEndsAt: "2026-04-09T00:53:41.978Z",
      roundStartedAt: "2026-04-09T01:30:28.355Z",
      roundCrashedAt: "2026-04-09T01:37:53.857Z",
      serverSeed:
        "f6834941d2ed8d5a702b04282bf39283d39e2d6ebcc8e5df0abd0a74a094fc3b",
      clientSeed: "jungle_1775696006967",
      nonce: 0,
      createdAt: "2026-04-09T00:53:26.977Z",
      updatedAt: "2026-04-09T01:37:53.891Z",
      bets: [
        {
          id: "24c8ec36-8dd7-4b59-83da-9423437974b8",
          roundId: "960f2630-7a15-4186-ac1f-7b01d6f5e5ca",
          userId: "328b5bea-d4f9-4a58-a504-5a12c2be5220",
          amount: 10000,
          multiplier: 11.29,
          status: "cashed_out",
          cashedOutAt: "2026-04-09T01:30:49.064Z",
          createdAt: "2026-04-09T01:30:25.090Z",
          updatedAt: "2026-04-09T01:30:49.074Z",
        },
      ],
    },
    {
      roundId: "90a2f0eb-a0ed-4bf7-a598-925447dbf7e5",
      crashPoint: 1.39,
      serverSeedHash:
        "dafd2cd1f754c013f6ed8e52b2c624e9c15dba41946dda702dad35facc076b41",
      endedAt: "2026-04-09T00:47:41.767Z",
      status: "crashed",
      multiplier: 1.39,
      bettingStartedAt: "2026-04-09T00:47:26.768Z",
      bettingEndsAt: "2026-04-09T00:47:41.767Z",
      roundStartedAt: "2026-04-09T00:47:56.757Z",
      roundCrashedAt: "2026-04-09T00:53:11.974Z",
      serverSeed:
        "43ea3a61ff4636becc364d4b99655f13b2f46b6d423685fbbd3a0fdb382724ff",
      clientSeed: "jungle_1775695646742",
      nonce: 0,
      createdAt: "2026-04-09T00:47:26.765Z",
      updatedAt: "2026-04-09T00:53:12.040Z",
      bets: [],
    },
    {
      roundId: "25f96bd3-5385-400d-b894-31e211bbd48b",
      crashPoint: 1.7,
      serverSeedHash:
        "12cf3aff58cba2e3613b13e9d16e0550a50b40e25600ed67a246a9f5b133b03c",
      endedAt: "2026-04-09T00:38:11.498Z",
      status: "crashed",
      multiplier: 1.7,
      bettingStartedAt: "2026-04-09T00:37:56.498Z",
      bettingEndsAt: "2026-04-09T00:38:11.498Z",
      roundStartedAt: "2026-04-09T00:38:26.471Z",
      roundCrashedAt: "2026-04-09T00:47:12.239Z",
      serverSeed:
        "75962d7e074ff3e09096c16b574ca9e4521d6acbf7cda86e800b02bc0bef2f1f",
      clientSeed: "jungle_1775695076453",
      nonce: 0,
      createdAt: "2026-04-09T00:37:56.496Z",
      updatedAt: "2026-04-09T00:47:12.362Z",
      bets: [],
    },
    {
      roundId: "b7aaa95d-a765-488e-a4d6-04811a87af46",
      crashPoint: 2.24,
      serverSeedHash:
        "8592aeff92815f104f6c76c3171d1b96e8b6ab3ac4b2e5c618ae2bf8c8e0189b",
      endedAt: "2026-04-09T00:24:10.828Z",
      status: "crashed",
      multiplier: 2.23,
      bettingStartedAt: "2026-04-09T00:23:55.828Z",
      bettingEndsAt: "2026-04-09T00:24:10.828Z",
      roundStartedAt: "2026-04-09T00:27:25.929Z",
      roundCrashedAt: "2026-04-09T00:37:41.562Z",
      serverSeed:
        "cda2c94a087b537bbcdfea5dd6ddb0e7fcb2d549353978a18a879b28eb3b8e01",
      clientSeed: "jungle_1775694235819",
      nonce: 0,
      createdAt: "2026-04-09T00:23:55.827Z",
      updatedAt: "2026-04-09T00:37:41.774Z",
      bets: [],
    },
    {
      roundId: "9e5e8350-6627-436e-b9ed-56886daf1462",
      crashPoint: 1.12,
      serverSeedHash:
        "3a5023a86cbb96820268d82dacf7ce86341e3f3c4fce8e31d41c0d3fcc8797ba",
      endedAt: "2026-04-09T00:21:40.805Z",
      status: "crashed",
      multiplier: 1.12,
      bettingStartedAt: "2026-04-09T00:21:25.805Z",
      bettingEndsAt: "2026-04-09T00:21:40.805Z",
      roundStartedAt: "2026-04-09T00:21:55.805Z",
      roundCrashedAt: "2026-04-09T00:23:40.918Z",
      serverSeed:
        "6f2a3226a3c5b75f5b77fbe2dfbf0c0b33e6a9759d77c8a314a40861daae06bc",
      clientSeed: "jungle_1775694085777",
      nonce: 0,
      createdAt: "2026-04-09T00:21:25.805Z",
      updatedAt: "2026-04-09T00:23:32.027Z",
      bets: [],
    },
    {
      roundId: "ba2226af-3f35-44df-9fdf-8a0ce1160230",
      crashPoint: 1.76,
      serverSeedHash:
        "438b58376ecbe0f0c9c8fee0d8f810fabb89ac2921deb341bb41eaf1b70c4d20",
      endedAt: "2026-04-09T00:11:40.480Z",
      status: "crashed",
      multiplier: 1.75,
      bettingStartedAt: "2026-04-09T00:11:25.480Z",
      bettingEndsAt: "2026-04-09T00:11:40.480Z",
      roundStartedAt: "2026-04-09T00:12:40.496Z",
      roundCrashedAt: "2026-04-09T00:21:11.025Z",
      serverSeed:
        "a928d01e1073a01862f63fc4eb500583947eba69e11ebf52c6b408e9ef72c91d",
      clientSeed: "jungle_1775693485437",
      nonce: 0,
      createdAt: "2026-04-09T00:11:25.476Z",
      updatedAt: "2026-04-09T00:21:11.082Z",
      bets: [],
    },
    {
      roundId: "fda34e1c-33c0-4c9d-9cb2-7dbf154c9631",
      crashPoint: 1,
      serverSeedHash:
        "a55c2d9970802619208fca8fee239ac7b1d082cb190bb3f3f1e19e6bd3af8d0e",
      endedAt: "2026-04-09T00:08:45.323Z",
      status: "crashed",
      multiplier: 1,
      bettingStartedAt: "2026-04-09T00:08:30.323Z",
      bettingEndsAt: "2026-04-09T00:08:45.323Z",
      roundStartedAt: "2026-04-09T00:11:10.421Z",
      roundCrashedAt: "2026-04-09T00:11:10.540Z",
      serverSeed:
        "dfe419c3d63237a973d72b60d89dbea0815606fd0ca75310da644e504b248fda",
      clientSeed: "jungle_1775693310231",
      nonce: 0,
      createdAt: "2026-04-09T00:08:30.325Z",
      updatedAt: "2026-04-09T00:11:10.610Z",
      bets: [],
    },
    {
      roundId: "0a877f0e-e5b9-4d83-a22f-71e5433144af",
      crashPoint: 1.42,
      serverSeedHash:
        "0818360e1f8349f2eee18c5ae8363f9504fa05bf7ba309352f245860093d259e",
      endedAt: "2026-04-08T23:52:52.465Z",
      status: "crashed",
      multiplier: 1.34,
      bettingStartedAt: "2026-04-08T23:52:37.466Z",
      bettingEndsAt: "2026-04-08T23:52:52.465Z",
      roundStartedAt: "2026-04-08T23:53:07.423Z",
      roundCrashedAt: "2026-04-09T00:08:17.144Z",
      serverSeed:
        "d76c535a8c65f559769ea25e3d48e34de05c6adb5663c263cfa9068e4bb710ec",
      clientSeed: "jungle_1775692357429",
      nonce: 0,
      createdAt: "2026-04-08T23:52:37.475Z",
      updatedAt: "2026-04-09T00:08:18.128Z",
      bets: [],
    },
    {
      roundId: "f219e1f8-b053-43b6-999c-eaa8f2b4e517",
      crashPoint: 3.16,
      serverSeedHash:
        "d1b2fbceec929381fd9eeee4ba73610e4848fce0bddf3162be98327bf91a4725",
      endedAt: "2026-04-08T23:33:07.251Z",
      status: "crashed",
      multiplier: 3.13,
      bettingStartedAt: "2026-04-08T23:32:52.252Z",
      bettingEndsAt: "2026-04-08T23:33:07.251Z",
      roundStartedAt: "2026-04-08T23:47:07.184Z",
      roundCrashedAt: "2026-04-08T23:52:22.414Z",
      serverSeed:
        "4caf088bfe21799cb36da24e9791c349ab3dd39ad684a7742b9853d7720491af",
      clientSeed: "jungle_1775691171855",
      nonce: 0,
      createdAt: "2026-04-08T23:32:52.275Z",
      updatedAt: "2026-04-08T23:52:22.520Z",
      bets: [],
    },
    {
      roundId: "d2d95e4b-3ca8-420f-8cc6-00ee06b1cd42",
      crashPoint: 2.22,
      serverSeedHash:
        "2f556e426ba9b9a9601d7f887cb69c78b269d16a58048bf90d99e87d6d3a5845",
      endedAt: "2026-04-08T23:12:15.156Z",
      status: "crashed",
      multiplier: 1.77,
      bettingStartedAt: "2026-04-08T23:12:00.156Z",
      bettingEndsAt: "2026-04-08T23:12:15.156Z",
      roundStartedAt: "2026-04-08T23:12:15.166Z",
      roundCrashedAt: "2026-04-08T23:32:40.883Z",
      serverSeed:
        "78329cc52cf3ed798612949ece8ec73ca23a78673471cad50822205350cb9fcb",
      clientSeed: "jungle_1775689920138",
      nonce: 0,
      createdAt: "2026-04-08T23:12:00.159Z",
      updatedAt: "2026-04-08T23:32:41.347Z",
      bets: [],
    },
    {
      roundId: "d84580f1-de86-4d04-9fcd-88cedb566fd7",
      crashPoint: 1.47,
      serverSeedHash:
        "a7d715b3344fd73389d0e8c36a8287edd6453aa3884256b4918f723ae07a31a8",
      endedAt: "2026-04-08T23:05:14.880Z",
      status: "crashed",
      multiplier: 1.47,
      bettingStartedAt: "2026-04-08T23:04:59.880Z",
      bettingEndsAt: "2026-04-08T23:05:14.880Z",
      roundStartedAt: "2026-04-08T23:05:29.892Z",
      roundCrashedAt: "2026-04-08T23:11:45.260Z",
      serverSeed:
        "2a5f9204bd128d7537d44d52f278e17c020594b4396d9bf045a78e892485b1e6",
      clientSeed: "jungle_1775689499865",
      nonce: 0,
      createdAt: "2026-04-08T23:04:59.880Z",
      updatedAt: "2026-04-08T23:11:45.415Z",
      bets: [],
    },
    {
      roundId: "5fd7f4d5-3468-454f-b98b-aad916929701",
      crashPoint: 1.17,
      serverSeedHash:
        "5c54d904b0c736675a8326ab99020d91937451011eece4e43423a0bf0541f87a",
      endedAt: "2026-04-08T23:01:59.767Z",
      status: "crashed",
      multiplier: 1.17,
      bettingStartedAt: "2026-04-08T23:01:44.767Z",
      bettingEndsAt: "2026-04-08T23:01:59.767Z",
      roundStartedAt: "2026-04-08T23:02:14.738Z",
      roundCrashedAt: "2026-04-08T23:04:44.933Z",
      serverSeed:
        "f8e30566c6480162e2c137f7c37017d7b1da4bfa2ef03d1f8d413e9e358c397b",
      clientSeed: "jungle_1775689304749",
      nonce: 0,
      createdAt: "2026-04-08T23:01:44.769Z",
      updatedAt: "2026-04-08T23:04:33.471Z",
      bets: [],
    },
    {
      roundId: "c6ab56d7-0324-4344-aee6-e9291618e63d",
      crashPoint: 1.08,
      serverSeedHash:
        "f3372d1805d581ab3c524394e55e5dd7a5484c6f0f5e1fd002000da6397b364d",
      endedAt: "2026-04-08T22:59:59.669Z",
      status: "crashed",
      multiplier: 1.07,
      bettingStartedAt: "2026-04-08T22:59:44.669Z",
      bettingEndsAt: "2026-04-08T22:59:59.669Z",
      roundStartedAt: "2026-04-08T23:00:14.668Z",
      roundCrashedAt: "2026-04-08T23:01:29.798Z",
      serverSeed:
        "546b1247ad0ee5059457da653c75d5ccb172317ed8b8d69f4cc04d06cda16c02",
      clientSeed: "jungle_1775689184646",
      nonce: 0,
      createdAt: "2026-04-08T22:59:44.673Z",
      updatedAt: "2026-04-08T23:01:08.085Z",
      bets: [],
    },
    {
      roundId: "92fbeaf2-f581-46f5-8562-a324d7a79165",
      crashPoint: 1.51,
      serverSeedHash:
        "6b951f6000984fba08f41cd69c6f38f3ccaf4c75c672f9ae0c26b3db35d31448",
      endedAt: "2026-04-08T22:52:29.444Z",
      status: "crashed",
      multiplier: 1.5,
      bettingStartedAt: "2026-04-08T22:52:14.444Z",
      bettingEndsAt: "2026-04-08T22:52:29.444Z",
      roundStartedAt: "2026-04-08T22:52:44.401Z",
      roundCrashedAt: "2026-04-08T22:59:29.798Z",
      serverSeed:
        "efef179a1e79ac8b9d83253082b49d2789871cfe7f9a26651d790d3e95a67fbc",
      clientSeed: "jungle_1775688734391",
      nonce: 0,
      createdAt: "2026-04-08T22:52:14.447Z",
      updatedAt: "2026-04-08T22:59:12.797Z",
      bets: [],
    },
    {
      roundId: "caf51853-d50d-42f9-b4c0-cb7aa0654894",
      crashPoint: 3.62,
      serverSeedHash:
        "1f90d1a19c4050b6e950a7d9065363f9f4ab06c7b03afd3430793da1c189dc96",
      endedAt: "2026-04-08T22:30:28.497Z",
      status: "crashed",
      multiplier: 3.61,
      bettingStartedAt: "2026-04-08T22:30:13.497Z",
      bettingEndsAt: "2026-04-08T22:30:28.497Z",
      roundStartedAt: "2026-04-08T22:30:43.420Z",
      roundCrashedAt: "2026-04-08T22:51:59.491Z",
      serverSeed:
        "21f83f25fcd1cec79ee15779e7b9e69472af3a31f99360ff301c8e92aa9aabbb",
      clientSeed: "jungle_1775687413443",
      nonce: 0,
      createdAt: "2026-04-08T22:30:13.500Z",
      updatedAt: "2026-04-08T22:51:51.914Z",
      bets: [],
    },
    {
      roundId: "b9fffed2-19ee-4196-b372-64fc68611e96",
      crashPoint: 2.54,
      serverSeedHash:
        "44fde2e10482bb3214c8c1b41bb423bd85ab46dcc584aab9c26419c61fd7c154",
      endedAt: "2026-04-08T22:14:17.813Z",
      status: "crashed",
      multiplier: 2.54,
      bettingStartedAt: "2026-04-08T22:14:02.813Z",
      bettingEndsAt: "2026-04-08T22:14:17.813Z",
      roundStartedAt: "2026-04-08T22:14:32.776Z",
      roundCrashedAt: "2026-04-08T22:29:58.475Z",
      serverSeed:
        "35950030ce054f3b7a77bc083d6d6c3d0ea50b5603c5058542af0572e1a75148",
      clientSeed: "jungle_1775686442749",
      nonce: 0,
      createdAt: "2026-04-08T22:14:02.815Z",
      updatedAt: "2026-04-08T22:29:49.137Z",
      bets: [],
    },
  ];
}

export default async function RoundsPage() {
  const initialRounds = await getRounds();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header com informações de segurança */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Auditoria de Rodadas
              </h1>
              <p className="text-sm text-slate-400">
                Verifique a公平idade de todas as rodadas e apostas
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-xs text-yellow-500">Provably Fair</span>
            </div>
          </div>

          <RoundsList initialRounds={initialRounds} />
        </div>
      </div>
    </div>
  );
}
