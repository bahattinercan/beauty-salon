import 'dart:io';

import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'api_client.dart';

/// /upload/multiple endpoint'ine çoklu görsel gönderir ve url listesi döner.
class UploadService {
  final Dio _dio;

  UploadService({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  Future<List<String>> uploadImages(List<XFile> files) async {
    if (files.isEmpty) return const [];

    final form = FormData();
    for (final file in files) {
      form.files.add(MapEntry(
        'files',
        MultipartFile.fromBytes(
          await File(file.path).readAsBytes(),
          filename: file.name,
        ),
      ));
    }

    final res = await _dio.post('/upload/multiple', data: form);
    final data = res.data['data'];
    if (data is List) {
      return data
          .map((e) => (e as Map)['url']?.toString() ?? '')
          .where((url) => url.isNotEmpty)
          .toList();
    }
    return const [];
  }
}
