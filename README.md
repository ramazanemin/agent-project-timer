# Agent Project Timer

AI agentları için yerel, otomatik proje süre takibi. Codex, Claude Code, güncel Cline CLI/SDK ve OpenCode V1 bağlantıları; Türkçe canlı panel. Node.js built-in SQLite ile **sıfır harici bağımlılık**.

## Hızlı başlangıç

Node.js **22.13+** gerekir (Node 24 LTS önerilir). Bu depo henüz npm registry üzerinde yayımlanmış değildir.

```powershell
cd D:\Projeler\agent-project-timer
npm install -g .
agent-timer serve
```

npm olmadan da başlatabilirsin:

```powershell
node src/cli.js serve
```

Veya PowerShell içinde  `.\Start-Panel.ps1` çalıştır; bu başlatıcı kayıtları projenin `.data` klasöründe tutar. Agentları aynı terminalden açarsan aynı veritabanını kullanırlar.

Panel: http://127.0.0.1:4317

Takip edeceğin **proje klasöründe**, kullandığın agentı bağla:

```powershell
agent-timer install codex
agent-timer install claude
agent-timer install cline
agent-timer install opencode
```

Yalnız kullandığın agentların komutlarını çalıştır. Alternatif: `agent-timer install codex --project "D:\Projeler\benim-projem"`. Komutlar global ayarlarını değiştirmez. Var olan hookları korur; JSON değişirse `.timer-backup` yedeği oluşturur. Üretilen hooklar Node ve bu kurulumun mutlak dosya yolunu kullanır: paketi taşırsan yeniden bağlantı kur.

Agentı yeniden başlat ve hookları etkinleştir/güvenilir olarak işaretle. Sonraki çalışmada proje panelde otomatik oluşur. Panelin açık olması gerekmez; süre kaydı doğrudan veritabanına yazılır.

## Nasıl ölçer?

- Yeni mesaj ve agent çalışması → sayaç başlar.
- Yanıtın bitmesi, desteklenen kesinti/hata olayları → sayaç durur.
- Yeni mesaj → aynı proje birikmiş süresinden devam eder.
- İzin/yanıt bekleme olayları mevcut bağlayıcının desteklediği ölçüde duraklatılır. Desteklenmeyen özel araç beklemeleri ölçüme dahil olabilir.
- **Tamamlandı** düğmesi projeyi kapatır. Agentın bir görevi bitirmesi projeyi otomatik tamamlamaz. Yeni kayıt için panelden **Tekrar aç** gerekir.
- **Aktif süre:** çalışma aralıklarının toplamı. Aynı projede paralel agentlar proje toplamında iki kez sayılmaz. Agent bazında süreler ayrıca gösterilir.
- **Geçen süre:** ilk başlangıçtan şimdiye/tamamlanmaya kadar takvim süresi. Bekleme dahil.
- Paneldeki **Duraklat** mevcut açık oturumları kapatır; sonraki agent olayı sayacı yeniden başlatabilir.

## Uyumluluk ve kurulum ayrıntıları

| Agent | Bağlantı | Kullanıcının yapacağı işlem |
| --- | --- | --- |
| Codex CLI / yerel desktop | `.codex/hooks.json` | Hook destekleyen güncel sürüm. CLI `/hooks`; desktop Settings → Hooks ile incele ve güven. Proje katmanının da güvenilir olması gerekir. Kurumsal politika hookları engelleyebilir. |
| Claude Code | `.claude/settings.local.json` | Hookları etkinleştir, oturumu yeniden başlat. `UserPromptSubmit`, `Stop`, hata/oturum sonu ve araç olayları. |
| Cline güncel CLI/SDK | `.cline/hooks/*.mjs` | Dosya hooklarını destekleyen SDK tabanlı sürüm gerekir. Bu bağlantı eski VS Code eklentisi ile aynı değildir. |
| Cline eski VS Code | `agent-timer install cline-legacy` → `.clinerules/hooks/*` | Yalnız Linux/macOS/WSL. Cline Hooks ayarını etkinleştir. Eski sürümlerde TaskComplete desteği eksik olabilir; önce deneme göreviyle kontrol et. Native Windows kurulumu bilinçli olarak reddedilir. |
| OpenCode **V1** | `.opencode/plugins/agent-project-timer.js` | Agentı yeniden başlat. `session.status`, `session.idle`, hata, izin/soru olayları izlenir. V2 API farklıdır; bu sürüm V2 bağlayıcısı sunmaz. |

**Doğrulama düzeyi:** otomatik testlerde gerçek SQLite, CLI alt süreçleri, üretilmiş Cline hookları, OpenCode callbackleri ve HTTP API çalıştırılır. Codex CLI 0.155.1 Windows üzerinde gerçek görevlerle canlı doğrulandı (13 Kasım 2026); ayrıntılar docs/live-test-2026-11-13.md. Diğer agentlarda canlı doğrulama yapılmadı. Kurulum sonrası küçük bir deneme göreviyle başlama/durma durumunu panelde kontrol et.

**Sınırlar:** bilgisayar kapanırsa veya agent stop olayı göndermeden çökerse açık süre otomatik kapanmaz. Panelden Duraklat kullan; bu sürüm geçmiş süre düzenlemesi sunmaz. Uzun sessiz düşünmeyi yanlışlıkla kesmemek için keyfi hareketsizlik zaman aşımı yoktur. Aynı oturumdan sırası bozulmuş lifecycle olayları gelirse doğruluk garanti edilmez. Özel shell karakterleri içeren hook yolları güvenli komut oluşturmak için reddedilir. Agent sandboxının Node ve veritabanı yoluna erişebilmesi gerekir. Uzak/container agentlar yerel veritabanına otomatik bağlanmaz.

## Veriler

Varsayılan veritabanı: `~/.agent-project-timer/timer.sqlite`.
Yalnız proje adı/yolu, agent, oturum kimliği ve zaman aralıkları saklanır. Prompt veya kod içeriği kaydedilmez. Ağ telemetrisi ve harici font isteği yoktur. Font tercihleri Sora/Inter; kurulu değilse sistem fontu kullanılır.

D: üzerinde saklamak için paneli **ve agentları başlatmadan önce** aynı ortam değişkenini ayarla:

```powershell
$env:AGENT_TIMER_DB = 'D:\CodexData\agent-timer\timer.sqlite'
agent-timer serve
```

Agentlar farklı terminal/uygulamadan açılıyorsa aynı değişkeni onlara da ilet; aksi halde varsayılan veritabanını kullanırlar. SQLite WAL kullanılır: yedek alırken bütün yazıcıları kapat ve `timer.sqlite`, varsa `-wal` ve `-shm` dosyalarını birlikte koru. Sunucu yalnız `127.0.0.1` dinler; origin/host kontrolleri vardır. İnternete açmak için tasarlanmamıştır.

## Kütüphane

```js
import { TimerStore } from 'agent-project-timer';
const timer = new TimerStore();
try {
  timer.event({ project: process.cwd(), agent: 'codex', session: 'run-1', state: 'start' });
  // agent çalışır...
  timer.event({ project: process.cwd(), agent: 'codex', session: 'run-1', state: 'stop' });
  console.log(timer.list());
} finally {
  timer.close();
}
```

`event` aynı aktif oturum için yinelenen startları birleştirir. `complete(id)`, `reopen(id)`, `pause(id)`, `rename(id,name)` yönetim API'leridir. `normalize(agent,event,payload)` desteklenmeyen/kimliği eksik olaylarda `null` döner. CLI hookları süre kaydı başarısız olsa da agentın çalışmasını engellemez; stderr'e uyarı yazar.

## Geliştirme ve GitHub

```sh
npm test
npm pack --dry-run
```

GitHub Actions, Windows/Ubuntu üzerinde Node 22 ve 24 testlerini çalıştırır. GitHub'da boş `agent-project-timer` deposu oluşturduktan sonra:

```sh
git remote add origin https://github.com/KULLANICI/agent-project-timer.git
git push -u origin main
```

Bu kod MIT lisanslıdır. npm adı uygunluğu ve registry yayını ayrıca yapılmalıdır; kurulum rehberi registry yayını varsaymaz.

## Resmî entegrasyon referansları

- [Codex Hooks](https://learn.chatgpt.com/docs/hooks)
- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- [Cline SDK hook örnekleri](https://github.com/cline/cline/tree/main/sdk/examples/hooks)
- [Cline eski eklenti hookları](https://github.com/cline/cline/blob/main/.clinerules/hooks/README.md)
- [OpenCode V1 eklentileri](https://opencode.ai/docs/en/plugins)

Windows bağlantısı için node PATH üzerinde bulunmalıdır. 0.1.0 kullananlar install komutunu yeniden çalıştırıp değişen hookları agentta yeniden incelemelidir.
