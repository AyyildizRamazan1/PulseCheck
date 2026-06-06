# 🟢 PulseCheck

🇬🇧 [Click here for English documentation](README.md)

> **Gerçek zamanlı uptime izleme — güvenilirlik için inşa edildi, geliştiriciler için tasarlandı.**

PulseCheck, kurumsal kalitede bir full-stack uptime izleme sistemidir. HTTP endpoint'lerinizi kalıcı bir Quartz Scheduler aracılığıyla periyodik olarak ping atar, her kontrol sonucunu loglar ve canlı durum verilerini modern bir dark-mode dashboard üzerinden sunar. Monitörler sunucu yeniden başlatmalarına karşı dayanıklıdır, sahiplik API katmanında zorunlu kılınır ve tüm yüzey durumsuz JWT kimlik doğrulaması ile güvence altına alınmıştır.

---

## 📸 Arayüz Görüntüleri


| Dashboard Genel Görünüm | Monitör Detayı & Grafik | Boş Durum Ekranı |
|---|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Detay](docs/screenshots/detail.png) | ![Boş](docs/screenshots/empty.png) |

---

## ✨ Temel Özellikler

- 🔁 **Dinamik Zamanlama** — Her monitör, kendine ait bir Quartz trigger üzerinde çalışır. Kontrol aralığı, timeout süresi ve beklenen HTTP durum kodu monitör bazında yapılandırılabilir; değişiklikler güncelleme anında devreye girer.
- 📋 **Kontrol Başına Log Geçmişi** — Her ping sonucu (durum, HTTP kodu, yanıt süresi, hata mesajı) PostgreSQL'e kalıcı olarak yazılır ve sayfalı (paginated) bir API aracılığıyla sunulur.
- 📊 **Canlı Yanıt Süresi Grafiği** — Recharts tabanlı çizgi grafik, son 50 kontrol sonucunu renk kodlu noktalarla (UP / DOWN / TIMEOUT / ERROR) görselleştirir.
- 🔒 **JWT Kimlik Doğrulaması** — Spring Security ile durumsuz token tabanlı kimlik doğrulama. Access token'lar bir Axios istek interceptor'ı tarafından otomatik eklenir; 401 yanıtları kullanıcıyı login sayfasına yönlendirir.
- 🔄 **Çökmeye Karşı Dayanıklılık** — `ApplicationRunner`, uygulama her ayağa kalktığında tüm aktif monitörleri yeniden zamanlar; yeniden başlatma veya deployment sonrasında hiçbir kontrol atlanmaz.
- 🛡️ **Bilgi Sızdırmama (Security by Obscurity)** — Sahiplik kontrolü yapan endpoint'ler, başkasının kaynağına erişim denemesinde `403 Forbidden` yerine `404 Not Found` döner; böylece kaynağın varlığı saldırgana sızdırılmaz.
- 📄 **Sayfalı Yanıtlar** — Tüm liste endpoint'leri, sunucu tarafında zorunlu kılınan sıralama ile Spring Data `Pageable` kullanır; Swagger UI'ın varsayılan parametreleriyle tam uyumludur.
- 🌑 **Dark-Mode Dashboard** — TailwindCSS utility-first arayüzü; canlı pulse göstergesi, istatistik kartları (toplam / UP / DOWN / ortalama yanıt süresi) ve satır içi düzenle/sil/duraklat aksiyonları içerir.
- 📖 **Swagger UI** — Her endpoint, ek bir araç gerekmeksizin `/api/swagger-ui/index.html` adresinden belgelenir ve test edilebilir.

---

## 🛠️ Teknoloji Yığını

### Frontend

| Teknoloji | Rol |
|---|---|
| **React 18** + **TypeScript** | Bileşen framework'ü ve tip güvenliği |
| **Vite** | Geliştirme sunucusu ve production bundler |
| **TailwindCSS** | Utility-first stillendirme ve dark tema |
| **Recharts** | Yanıt süresi çizgi grafiği |
| **Axios** | JWT interceptor'lı HTTP istemcisi |
| **React Router v6** | İstemci taraflı yönlendirme ve korumalı rotalar |
| **Lucide React** | İkon kütüphanesi |

### Backend

| Teknoloji | Rol |
|---|---|
| **Spring Boot 3.2** | Uygulama framework'ü |
| **Spring Security 6** | JWT filtre zinciri, metod seviyesi yetkilendirme |
| **Quartz Scheduler** | Kalıcı, monitör başına cron işleri |
| **Spring Data JPA** + **Hibernate** | ORM, `@Version` ile optimistic locking |
| **PostgreSQL 16** (TimescaleDB) | Birincil veri deposu |
| **Flyway** | Şema versiyonlama ve migration'lar |
| **MapStruct** | Derleme zamanı entity ↔ DTO dönüşümü |
| **Springdoc OpenAPI** | Otomatik oluşturulan Swagger dokümantasyonu |
| **Lombok** | Standart kod azaltma |
| **Docker Compose** | Yerel Postgres + Redis servisleri |

---

## 🏗️ Mimari Kararlar

Sıradan bir CRUD uygulamasının ötesine geçen tasarım kararları.

### 1 · Quartz Scheduler — Dinamik, Monitör Başına İşler

Çoğu izleme aracı, tüm aktif satırları tarayan tek bir cron çalıştırır. PulseCheck farklı bir yaklaşım benimser: **her monitör, kendine ait bir Quartz `JobDetail` ve `SimpleTrigger`'a sahiptir**.

```
POST /monitors  →  MonitorService.createMonitor()
                       └─ MonitorSchedulerService.scheduleMonitor()
                               └─ scheduler.scheduleJob(jobDetail, trigger)
                                       └─ her N saniyede MonitorCheckJob'ı tetikler
```

Bir monitör güncellendiğinde (yeni aralık, yeni URL, aktif/pasif değişimi) eski trigger **atomik olarak silinir ve yeniden zamanlanır**. Bir monitör devre dışı bırakıldığında `scheduler.deleteJob()` çağrılır; heartbeat bir sonraki tarama döngüsünü beklemeksizin o an durur.

`MonitorCheckJob`, sıradan bir Quartz `Job`'ıdır (Spring bean değil), ancak `@Autowired` repository'leri kullanır. Bu, `QuartzConfig` içindeki `AutowiringSpringBeanJobFactory`'nin `beanFactory.autowireBean(job)` çağrısı sayesinde mümkündür.

---

### 2 · `ApplicationRunner` — Çökmeye Karşı Dayanıklı Zamanlama

Quartz'ın `RAMJobStore`'u (local/dev profilde kullanılır) bellekte tutulur ve JVM yeniden başlatmalarından sağ çıkamaz. `MonitorStartupRunner` bu boşluğu kapatır:

```java
@Component
public class MonitorStartupRunner implements ApplicationRunner {
    public void run(ApplicationArguments args) {
        monitorRepository.findByEnabled(true)
            .forEach(schedulerService::scheduleMonitor);
    }
}
```

Her başlatmada, önceden aktif olan tüm monitörler scheduler'a yeniden eklenir. **Bir çöküş veya deployment sonrasında sıfır manuel müdahale yeterlidir.**

> Production deployment'larda bu yaklaşım, Quartz'ın JDBC tabanlı `JobStoreTX`'i ile değiştirilebilir (küme güvenli, yeniden başlatmalara karşı doğal dayanıklı). `ApplicationRunner` pattern'i, tekli sunucu kurulumları için açık ve denetlenebilir bir alternatif olarak tasarlandı.

---

### 3 · 403 Yerine 404 — Bilgi Sızdırmayı Önleme

Sıradan bir implementasyon, kullanıcı başkasının monitörüne ait logları istediğinde `403 Forbidden` döner. Bu yanıt, saldırgana kaynağın *var olduğunu* söyler — UUID tarama saldırıları için kıymetli bir ipucu.

`CheckLogService`, **gizlilikle güvenlik (security-through-obscurity)** pattern'ini uygular:

```java
Monitor monitor = monitorRepository.findById(monitorId)
    .orElseThrow(() -> new ResourceNotFoundException("Monitor not found"));

if (!monitor.getUser().getId().equals(currentUserId)) {
    // Varlığını ele verme — "bulunamadı" ile aynı yanıt
    throw new ResourceNotFoundException("Monitor not found");
}
```

"Kayıt yok" ve "kayıt var ama sana ait değil" durumlarının ikisi de `404` döner. Saldırgan her iki yanıttan da hiçbir şey öğrenemez.

---

### 4 · Zorunlu Sunucu Taraflı Sıralama (Swagger Uyumlu Sayfalama)

Swagger UI, varsayılan `Pageable` parametresi olarak `?sort=string` gönderir. Spring Data JPA bunu saf şekilde JPQL `ORDER BY` ifadesine ekler ve `ORDER BY cl.string asc` üretir — eşleşmeyen alan adı `UnknownPathException` fırlatır.

Çözüm, repository `@Query`'sinden `ORDER BY` ifadesini tamamen kaldırmak ve sıralamayı servis katmanında zorla uygulamaktır:

```java
// CheckLogService.java
Pageable sorted = PageRequest.of(
    pageable.getPageNumber(),
    pageable.getPageSize(),
    Sort.by(Sort.Direction.DESC, "checkedAt")   // her zaman kazanır
);
return checkLogRepository.findByMonitorIdPaged(monitorId, sorted);
```

İstemcinin gönderdiği sıralama parametresi sessizce geçersiz sayılır. Endpoint hem Swagger UI'dan hem de production istemcilerden gelen çağrılarda doğru çalışır.

---

## 📖 API Dokümantasyonu

Swagger UI tüm profillerde paketlenmiş ve etkindir.

```
http://localhost:8080/api/swagger-ui/index.html
```

`POST /api/api/auth/login` ve `POST /api/api/auth/register` dışındaki tüm endpoint'ler `Bearer <token>` başlığı gerektirir. Token'ı global olarak ayarlamak için Swagger UI'daki **Authorize** düğmesini kullanın.

---

## 🚀 Kurulum ve Çalıştırma

### Ön Gereksinimler

| Araç | Sürüm |
|---|---|
| Java | 17+ |
| Maven | 3.9+ |
| Node.js | 18+ |
| Docker | 24+ (yerel Postgres için) |

---

### 1 · Veritabanını Başlatın

```bash
docker-compose up -d postgres
```

Bu komut, **5433 portu** üzerinde şu yapılandırmayla bir TimescaleDB (PostgreSQL 16) container'ı başlatır:

- Veritabanı: `pulsecheck`
- Kullanıcı: `pulsecheck`
- Şifre: `pulsecheck123`

---

### 2 · Backend'i Yapılandırın

`backend/.env` dosyası oluşturun (gitignore kapsamında):

```env
JWT_SECRET=en-az-256-bit-uzunlugunda-super-gizli-anahtar
DATABASE_URL=jdbc:postgresql://localhost:5433/pulsecheck
DATABASE_USERNAME=pulsecheck
DATABASE_PASSWORD=pulsecheck123
```

> `.env` dosyası yoksa `local` Spring profili, `application.yml` içinde tanımlı güvenli geliştirme varsayılanlarını kullanır. Production deployment'larında `JWT_SECRET` her zaman ortam değişkeni (environment variable) olarak sağlanmalıdır.

---

### 3 · Backend'i Çalıştırın

```bash
cd backend
mvn spring-boot:run
```

Flyway, ilk başlatmada tüm migration'ları (`V1__`, `V2__`, …) otomatik olarak uygular. Sunucu, `/api` context path'i ile **`http://localhost:8080`** adresinde dinlemeye başlar.

---

### 4 · Frontend'i Çalıştırın

```bash
cd frontend
npm install
npm run dev
```

Vite geliştirme sunucusu **`http://localhost:5173`** adresinde başlar. `vite.config.ts` içinde yapılandırılan `/api` proxy'si, tüm API çağrılarını `http://localhost:8080` adresine yönlendirir.

---

### 5 · İlk Giriş

1. `http://localhost:5173/register` adresini açın ve bir hesap oluşturun.
2. `http://localhost:5173/login` adresinden giriş yapın.
3. Dashboard'dan ilk monitörünüzü ekleyin.

---

## 📁 Proje Yapısı

```
PulseCheck/
├── backend/
│   ├── src/main/java/com/pulsecheck/
│   │   ├── auth/               # Kayıt, giriş, JWT, User entity
│   │   ├── monitor/            # Monitör CRUD, Quartz işleri, CheckLog API
│   │   │   ├── controller/
│   │   │   ├── service/        # MonitorService, CheckLogService, MonitorSchedulerService
│   │   │   ├── job/            # MonitorCheckJob (Quartz)
│   │   │   └── entity/         # Monitor, CheckLog
│   │   └── common/             # BaseEntity, SecurityConfig, GlobalExceptionHandler
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/       # Flyway SQL migration dosyaları
├── frontend/
│   ├── src/
│   │   ├── pages/              # Dashboard, Login, Register
│   │   ├── components/         # Navbar, MonitorCard, UptimeChart
│   │   ├── context/            # AuthContext (JWT yönetimi)
│   │   └── services/           # api.ts (Axios instance + interceptor'lar)
│   └── vite.config.ts
└── docker-compose.yml
```

---

## 🔐 Güvenlik Notları

- JWT secret'ları **asla** commit edilmez. Yerel geliştirmede `.env` kullanın; CI/CD ortamında ortam değişkeni olarak enjekte edin.
- Şifreler, kalıcı olarak kaydedilmeden önce **BCrypt** ile hashlenir.
- `User.password` ve `User.authorities` alanları `@JsonIgnore` ile işaretlenmiştir — hiçbir API yanıtında **asla** serileştirilmezler.
- Tüm monitör ve log endpoint'leri, kimliği doğrulanmış kullanıcıyı JWT principal'dan çözer; doğrudan ID manipülasyonu servis katmanında reddedilir.

---

## 📄 Lisans

MIT — özgürce kullanabilir, değiştirebilir ve dağıtabilirsiniz.

---

<p align="center">
  ☕ Spring Boot ve ⚛️ React ile inşa edildi &nbsp;·&nbsp; PulseCheck © 2026
</p>