import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

/// Tüm veri katmanları HTTP erişimini bu provider üzerinden alır.
/// Testlerde `ProviderOverride(apiClientProvider, ApiClient(dio: fakeDio))`
/// ile sahte bir istemci verilebilir.
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
