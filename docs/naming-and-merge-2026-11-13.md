# Desktop isimleri ve kayıt birleştirme

Kullanıcı 13 Kasım 2026 tarihinde iki kaydın birleştirilmesini ve yanlış isimlerin düzeltilmesini açıkça istedi.

- Hata: klasörün basename değeri (`ai`, `k`, `qw` gibi) kullanıcıya proje adı olarak gösteriliyordu.
- Doğrulama: Codex Desktop bağlantısındaki gerçek görünen başlıklar, yerel `threads.name` alanıyla eşleşti. `threads.title` alanı ilk kullanıcı mesajını içerebildiği için kullanılmıyor.
- Düzeltme: Desktop hookları isim ve gerçek çalışma alanını salt okunur metadata sorgusundan alır. Elle verilmiş isimler korunur. Eksik veya değişmiş metadata şeması takibi durdurmaz.
- Birleştirme: onaylanan kaynak ID 2, hedef ID 1'e taşındı. Önce `work/backups/timer-before-merge-1794574917832.sqlite` yedeği alındı. Aynı oturumun bilinen kapanışıyla bir açık kopya düzeltildi. Zaman aralıkları korunarak birleşim hesabı kullanıldı; yaklaşık 15 saatlik hayalet çalışma süresi kaldırıldı.
- Mevcut beş kısa klasör adı, Codex Desktop listesindeki gerçek sohbet adlarıyla eşleştirildi. Panelde altı doğru adlı satır görüldü; bu sohbet yalnız bir satırda kaldı.

Yeni testler: gerçek CLI hook alt sürecinde Desktop adı/çalışma alanı; proje adının sohbet adına önceliği; eksik metadata; Desktop ad değişiklikleri ve elle verilen isimleri koruma; eski açık kopyayı bitiş kanıtıyla kapatma; geçersiz birleştirmenin geri alınması.

Doğrulama sınırı: bu oturumun Windows sandboxı HTTP testinin localhost bağlantısını `EACCES` ile engelledi. Diğer testler ve gerçek açık panelde isimlerin görüntülenmesi doğrulandı. Mevcut panel süreci sandbox dışından başlatılmış olduğundan bu oturumdan yeniden başlatılamadı; güncel hook kodu etkin, sunucunun listeleme sırasında isim yenileme özelliği bir sonraki normal panel başlangıcında yüklenir.

Publication verification, 2026-11-13: the complete suite passed 26/26 with ordinary network permissions, including the previously sandbox-blocked localhost HTTP test. Package contents checked with npm pack --dry-run.
