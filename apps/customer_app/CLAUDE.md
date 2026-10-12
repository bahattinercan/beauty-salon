# Customer App — Architecture Rules

> Source: `docs/flutter_architecture.docx`
> These rules are **non-negotiable defaults**. If a user request conflicts with a rule, state the conflict explicitly before complying.

---

## 1. Clean Architecture — Three Layers

| Layer | Responsibility |
|-------|---------------|
| **Domain** | Entities (pure Dart), abstract repositories, use cases, Failure types |
| **Data** | DTOs (models), repository implementations, remote/local datasources |
| **Presentation** | Widgets, screens, Riverpod providers, routing |

**Dependency direction:** Presentation → Domain ← Data. Domain imports **nothing** except pure Dart.
If `domain/` contains `import 'package:dio/...'` or any Flutter/third-party import → stop and refactor.

---

## 2. Directory Structure

```
lib/
├── core/
│   ├── di/              # get_it + injectable (injection.dart, app_module.dart)
│   ├── error/           # failures.dart (ServerFailure, CacheFailure, NetworkFailure, UnauthorizedFailure)
│   ├── constants/       # api_constants.dart, app_constants.dart
│   ├── network/         # api_client.dart
│   ├── services/        # notification_service.dart
│   ├── extensions/      # BuildContext, String, DateTime extensions
│   ├── utils/           # Pure helper functions (no Flutter/Dio imports)
│   ├── widgets/         # Reusable UI components used by 2+ features (SalonCard, etc.)
│   └── l10n/            # app_strings.dart (localization), locale_provider.dart
│
├── features/
│   └── <feature>/
│       ├── data/
│       │   ├── datasources/     # <feature>_remote_datasource.dart
│       │   ├── models/          # <feature>_model.dart  (DTO + toEntity())
│       │   └── repositories/    # <feature>_repository_impl.dart
│       ├── domain/
│       │   ├── entities/        # <entity>.dart  (pure Dart class)
│       │   ├── repositories/    # <feature>_repository.dart  (abstract)
│       │   └── usecases/        # get_x_usecase.dart, create_x_usecase.dart
│       └── presentation/
│           ├── providers/       # <feature>_provider.dart
│           ├── screens/         # <feature>_screen.dart
│           └── widgets/         # Extracted sub-widgets (only when screen > 200 lines)
│
├── app/
│   ├── router.dart              # go_router configuration
│   ├── widgets/                 # App-level shell widgets (MainScaffold)
│   └── theme/                   # AppColors, AppTheme, ThemeProvider
│
└── main.dart
```

---

## 3. Error Handling — Either\<Failure, T\>

**All** repository methods and use cases return `Either<Failure, T>` (fpdart).
Exceptions are caught **only in the Data layer** and converted to typed Failure subclasses.

```dart
// core/error/failures.dart
abstract class Failure { final String message; const Failure(this.message); }
class ServerFailure extends Failure { const ServerFailure(super.message); }
class CacheFailure extends Failure { const CacheFailure(super.message); }
class NetworkFailure extends Failure { const NetworkFailure([super.message = 'İnternet bağlantısı yok']); }
class UnauthorizedFailure extends Failure { const UnauthorizedFailure([super.message = 'Oturum süresi doldu']); }
```

**Prohibited:**
- `try/catch` in Presentation layer — use `Either.fold()` instead
- `throw` in Domain or Data public APIs — use `Left(Failure)` instead
- Generic `Exception` — every exception must map to a specific Failure subclass

---

## 4. Dependency Injection — get_it + injectable

```dart
// core/di/injection.dart
final getIt = GetIt.instance;

@InjectableInit()
Future<void> configureDependencies() async => getIt.init();
```

```dart
// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await configureDependencies();
  runApp(const ProviderScope(child: BeautySalonApp()));
}
```

**Annotations:**
- `@lazySingleton` — ApiClient, FlutterSecureStorage (in `@module`)
- `@injectable` — use cases, datasource impls, repo impls
- `@Injectable(as: AbstractType)` — when registering against an abstract class

**Never** instantiate services/repositories with `SomeClass()` inside a widget, provider, or use case. All dependencies come through `getIt<T>()`.

---

## 5. State Management — Riverpod (Manual NotifierProvider)

> ⚠️ `riverpod_generator` is **incompatible** with this project's Dart SDK (3.10.7). Do NOT add it.
> Use manual `NotifierProvider` / `AsyncNotifierProvider` instead of `@riverpod` annotation.

```dart
// CORRECT — manual NotifierProvider
class XNotifier extends AsyncNotifier<XState> {
  @override
  Future<XState> build() => _fetch();

  Future<void> someAction() async {
    final result = await getIt<XUseCase>()(...);
    result.fold(
      (failure) => /* handle */,
      (data) => state = AsyncData(data),
    );
  }
}

final xProvider = AsyncNotifierProvider<XNotifier, XState>(XNotifier.new);
```

Providers live in `presentation/providers/`. Never call use cases or `getIt` from Domain or Data layers.

`setState()` is only permitted for genuinely local, ephemeral UI state: animation controllers, focus nodes, form toggles. Business logic and server data must never live in a `State` class.

---

## 6. Models and Entities

### Domain Entities — pure Dart
```dart
// domain/entities/user.dart
class User {
  final String id;
  final String email;
  // Business logic getters allowed (formattedDate, initials, timeAgo, etc.)
  const User({required this.id, required this.email});
}
```

Use `@freezed sealed class` only when the entity is also used as a union type (e.g., `AuthState`).

### Data DTOs — with fromJson + toEntity()
```dart
// data/models/user_model.dart
@freezed
sealed class UserModel with _$UserModel {
  const factory UserModel({required String id, required String email, ...}) = _UserModel;
  factory UserModel.fromJson(Map<String, dynamic> json) => _$UserModelFromJson(json);
}

extension UserModelX on UserModel {
  User toEntity() => User(id: id, email: email, ...);
}
```

**freezed 3.x rules:**
- Use `sealed class` (not plain `class`) for freezed classes
- `@JsonKey` NOT allowed on constructor parameters — only on fields/getters
- Extensions need explicit import at usage sites

---

## 7. Repository Pattern

```dart
// domain/repositories/x_repository.dart
abstract class XRepository {
  Future<Either<Failure, XEntity>> getX(String id);
  Future<Either<Failure, Unit>> createX({required String param});
}

// data/repositories/x_repository_impl.dart
@Injectable(as: XRepository)
class XRepositoryImpl implements XRepository {
  final XRemoteDataSource _remote;
  XRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, XEntity>> getX(String id) async {
    try {
      final model = await _remote.getX(id);
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }
}
```

---

## 8. Use Cases — Single Responsibility

```dart
// domain/usecases/get_x_usecase.dart
@injectable
class GetXUseCase {
  final XRepository _repository;
  GetXUseCase(this._repository);

  Future<Either<Failure, XEntity>> call(String id) => _repository.getX(id);
}
```

One public method per use case (always `call()`). Presentation calls `getIt<GetXUseCase>()(params)`.

---

## 9. Routing — go_router

- Route definitions in `app/router.dart`
- Named routes mandatory — never raw path strings at call site
- Auth guard via `getIt<AuthRepository>().isLoggedIn()` in redirect

---

## 10. Widget Rules

- **200-line limit** — files exceeding this must extract sub-widgets into `presentation/widgets/`
- `StatelessWidget` first; `StatefulWidget` only for lifecycle/ephemeral UI state
- No business logic in `build()` — widgets observe state and dispatch events
- All `const`-eligible widgets must be `const`
- Always check `mounted` after `await` before using `BuildContext`

```dart
// WRONG
await someOperation();
Navigator.of(context).pop();

// CORRECT
await someOperation();
if (!mounted) return;
Navigator.of(context).pop();
```

---

## 11. Technology Stack

| Category | Package |
|----------|---------|
| State | `flutter_riverpod ^3.2.1` |
| Navigation | `go_router ^17.1.0` |
| Network | `dio` |
| DI | `get_it ^8.0.0` + `injectable ^2.5.0` |
| Error handling | `fpdart ^1.1.0` |
| Immutable models | `freezed ^3.0.0` + `freezed_annotation ^3.0.0` |
| Serialization | `json_serializable ^6.8.0` + `json_annotation ^4.9.0` |
| Code gen | `build_runner ^2.4.0` + `injectable_generator ^2.6.0` |
| Notifications | `flutter_local_notifications` |
| Secure storage | `flutter_secure_storage` |

---

## 12. Code Generation

```bash
# After adding/changing annotated classes
dart run build_runner build --delete-conflicting-outputs

# Watch mode during development
dart run build_runner watch --delete-conflicting-outputs
```

Never manually edit `*.g.dart` or `*.freezed.dart` files.

---

## 13. Testing Requirements

### 13.1 Unit Tests — Mandatory
Every use case must have unit tests covering: happy path, every Failure subtype it can return, and edge cases. Use `mocktail` for mocking abstract repositories.

```dart
void main() {
  late LoginUseCase sut;
  late MockAuthRepository mockRepo;

  setUp(() {
    mockRepo = MockAuthRepository();
    sut = LoginUseCase(mockRepo);
  });

  test('returns User on success', () async {
    when(() => mockRepo.login(any(), any()))
        .thenAnswer((_) async => Right(tUser));
    final result = await sut('a@b.com', 'x');
    expect(result, Right(tUser));
  });
}
```

### 13.2 Widget Tests
Key screens and reusable widgets must have widget tests covering: renders without error, loading/error/success states.

### 13.3 What NOT to Test
- Generated files: `*.g.dart`, `*.freezed.dart`
- Trivial getters/setters with no logic
- Third-party package internals

---

## 14. Prohibited Patterns

### Architecture Violations
| Pattern | Why |
|---------|-----|
| `SomeClass()` inside widget/provider | Bypasses DI, untestable |
| `try/catch` in Presentation | Use `Either.fold()` instead |
| `import 'package:dio/...'` in `domain/` | Violates layer separation |
| `riverpod_generator` | Incompatible with Dart SDK 3.10.7 |
| Business logic in `build()` | Extract to provider or use case |
| Raw path strings in navigation | Use named routes |
| `BuildContext` after `await` without `mounted` check | Stale context crash |

### Dart / Flutter Anti-Patterns
| Pattern | Why |
|---------|-----|
| `print()` in production | Use a logger package |
| `dynamic` / untyped `var` | Prevents tooling and causes runtime errors |
| `late` to bypass null-safety | Only permitted for `initState`-initialized fields |
| God widgets (layout + state + nav + logic in one `build()`) | Must be split |

### Package Hygiene
Before adding any new package, verify:
- pub.dev points ≥ 110
- Null safety supported
- Maintained within the last 6 months
- No critical open issues dominating GitHub
- Does not duplicate functionality already provided by an existing dependency

---

## 15. Conflict Resolution

If a user request conflicts with a rule (e.g., "add this API call to the widget"), **do not silently comply**.

State the conflict explicitly:
> "This would place business logic in the Presentation layer, which violates the architecture rules. Should I refactor it into a use case instead?"

Then proceed with the user's explicit instruction if they confirm the override.

---

## 16. Quick Checklist

Before marking any feature complete:

- [ ] `domain/` has zero Flutter or third-party imports
- [ ] All repository methods return `Either<Failure, T>`
- [ ] All dependencies injected via `getIt`, never `SomeClass()`
- [ ] No business logic inside `StatefulWidget` or `build()`
- [ ] `build_runner build` run after annotation changes
- [ ] Every use case has at least one unit test
- [ ] No `print()` calls remaining in production code
- [ ] All `const`-eligible widgets are `const`
- [ ] `mounted` checked after every `await` in a widget
- [ ] `go_router` used for all navigation, named routes only
