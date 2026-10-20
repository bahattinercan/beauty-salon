import 'package:flutter/material.dart';

/// Onboarding görsel alanının alt kenarını organik dalgaya çevirir
/// (Booksy referansındaki dalga kenar).
class WaveBottomClipper extends CustomClipper<Path> {
  /// Dalga başlangıç yüksekliği (0..1, alan yüksekliğinin oranı).
  final double startRatio;

  const WaveBottomClipper({this.startRatio = 0.68});

  @override
  Path getClip(Size size) {
    final h = size.height;
    final w = size.width;
    return Path()
      ..lineTo(w, 0)
      ..lineTo(w, h * (startRatio - 0.06))
      ..cubicTo(
        w * 0.74, h * (startRatio + 0.20),
        w * 0.56, h * (startRatio - 0.10),
        w * 0.34, h * (startRatio + 0.06),
      )
      ..cubicTo(
        w * 0.20, h * (startRatio + 0.17),
        w * 0.09, h * (startRatio + 0.14),
        0, h * (startRatio + 0.02),
      )
      ..close();
  }

  @override
  bool shouldReclip(covariant WaveBottomClipper oldClipper) =>
      oldClipper.startRatio != startRatio;
}
