// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format width=80

// **************************************************************************
// InjectableConfigGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

// ignore_for_file: no_leading_underscores_for_library_prefixes

import 'package:customer_app/core/di/app_module.dart' as _i977;
import 'package:customer_app/core/network/api_client.dart' as _i440;
import 'package:customer_app/core/services/image_picker_service.dart' as _i855;
import 'package:customer_app/core/services/location_service.dart' as _i219;
import 'package:customer_app/features/appointments/data/datasources/appointments_remote_datasource.dart'
    as _i582;
import 'package:customer_app/features/appointments/data/repositories/appointments_repository_impl.dart'
    as _i703;
import 'package:customer_app/features/appointments/domain/repositories/appointments_repository.dart'
    as _i896;
import 'package:customer_app/features/appointments/domain/usecases/cancel_appointment_usecase.dart'
    as _i932;
import 'package:customer_app/features/appointments/domain/usecases/get_appointments_usecase.dart'
    as _i886;
import 'package:customer_app/features/auth/data/datasources/auth_local_datasource.dart'
    as _i750;
import 'package:customer_app/features/auth/data/datasources/auth_remote_datasource.dart'
    as _i730;
import 'package:customer_app/features/auth/data/repositories/auth_repository_impl.dart'
    as _i715;
import 'package:customer_app/features/auth/domain/repositories/auth_repository.dart'
    as _i988;
import 'package:customer_app/features/auth/domain/usecases/forgot_password_usecase.dart'
    as _i938;
import 'package:customer_app/features/auth/domain/usecases/login_usecase.dart'
    as _i634;
import 'package:customer_app/features/auth/domain/usecases/logout_usecase.dart'
    as _i676;
import 'package:customer_app/features/auth/domain/usecases/register_usecase.dart'
    as _i450;
import 'package:customer_app/features/auth/domain/usecases/reset_password_usecase.dart'
    as _i116;
import 'package:customer_app/features/booking/data/datasources/booking_remote_datasource.dart'
    as _i655;
import 'package:customer_app/features/booking/data/repositories/booking_repository_impl.dart'
    as _i737;
import 'package:customer_app/features/booking/domain/repositories/booking_repository.dart'
    as _i576;
import 'package:customer_app/features/booking/domain/usecases/create_booking_usecase.dart'
    as _i506;
import 'package:customer_app/features/booking/domain/usecases/get_available_slots_usecase.dart'
    as _i78;
import 'package:customer_app/features/favorites/data/datasources/favorites_remote_datasource.dart'
    as _i797;
import 'package:customer_app/features/favorites/data/repositories/favorites_repository_impl.dart'
    as _i901;
import 'package:customer_app/features/favorites/domain/repositories/favorites_repository.dart'
    as _i1055;
import 'package:customer_app/features/favorites/domain/usecases/get_favorite_ids_usecase.dart'
    as _i319;
import 'package:customer_app/features/favorites/domain/usecases/toggle_favorite_usecase.dart'
    as _i627;
import 'package:customer_app/features/notifications/data/datasources/notification_remote_datasource.dart'
    as _i543;
import 'package:customer_app/features/notifications/data/repositories/notification_repository_impl.dart'
    as _i667;
import 'package:customer_app/features/notifications/domain/repositories/notification_repository.dart'
    as _i667;
import 'package:customer_app/features/notifications/domain/usecases/get_notifications_usecase.dart'
    as _i796;
import 'package:customer_app/features/notifications/domain/usecases/get_unread_count_usecase.dart'
    as _i619;
import 'package:customer_app/features/notifications/domain/usecases/mark_all_notifications_read_usecase.dart'
    as _i464;
import 'package:customer_app/features/notifications/domain/usecases/mark_notification_read_usecase.dart'
    as _i527;
import 'package:customer_app/features/onboarding/data/datasources/onboarding_local_datasource.dart'
    as _i370;
import 'package:customer_app/features/onboarding/data/repositories/onboarding_repository_impl.dart'
    as _i95;
import 'package:customer_app/features/onboarding/domain/repositories/onboarding_repository.dart'
    as _i2;
import 'package:customer_app/features/onboarding/domain/usecases/get_onboarding_seen_usecase.dart'
    as _i260;
import 'package:customer_app/features/onboarding/domain/usecases/mark_onboarding_seen_usecase.dart'
    as _i925;
import 'package:customer_app/features/onboarding/domain/usecases/reset_onboarding_seen_usecase.dart'
    as _i337;
import 'package:customer_app/features/profile/data/datasources/user_remote_datasource.dart'
    as _i273;
import 'package:customer_app/features/profile/data/repositories/user_repository_impl.dart'
    as _i320;
import 'package:customer_app/features/profile/domain/repositories/user_repository.dart'
    as _i468;
import 'package:customer_app/features/profile/domain/usecases/confirm_email_change_usecase.dart'
    as _i834;
import 'package:customer_app/features/profile/domain/usecases/get_profile_usecase.dart'
    as _i341;
import 'package:customer_app/features/profile/domain/usecases/request_email_change_usecase.dart'
    as _i823;
import 'package:customer_app/features/profile/domain/usecases/update_profile_usecase.dart'
    as _i1012;
import 'package:customer_app/features/reviews/data/datasources/reviews_remote_datasource.dart'
    as _i801;
import 'package:customer_app/features/reviews/data/repositories/reviews_repository_impl.dart'
    as _i389;
import 'package:customer_app/features/reviews/domain/repositories/reviews_repository.dart'
    as _i329;
import 'package:customer_app/features/reviews/domain/usecases/create_review_usecase.dart'
    as _i1029;
import 'package:customer_app/features/reviews/domain/usecases/get_my_reviews_usecase.dart'
    as _i122;
import 'package:customer_app/features/salon_detail/data/datasources/salon_detail_remote_datasource.dart'
    as _i819;
import 'package:customer_app/features/salon_detail/data/repositories/salon_detail_repository_impl.dart'
    as _i272;
import 'package:customer_app/features/salon_detail/domain/repositories/salon_detail_repository.dart'
    as _i512;
import 'package:customer_app/features/salon_detail/domain/usecases/get_salon_detail_usecase.dart'
    as _i370;
import 'package:customer_app/features/salon_detail/domain/usecases/get_salon_reviews_usecase.dart'
    as _i412;
import 'package:customer_app/features/salon_discovery/data/datasources/categories_remote_datasource.dart'
    as _i115;
import 'package:customer_app/features/salon_discovery/data/datasources/salons_remote_datasource.dart'
    as _i437;
import 'package:customer_app/features/salon_discovery/data/repositories/categories_repository_impl.dart'
    as _i610;
import 'package:customer_app/features/salon_discovery/data/repositories/salons_repository_impl.dart'
    as _i840;
import 'package:customer_app/features/salon_discovery/domain/repositories/categories_repository.dart'
    as _i159;
import 'package:customer_app/features/salon_discovery/domain/repositories/salons_repository.dart'
    as _i1024;
import 'package:customer_app/features/salon_discovery/domain/usecases/get_categories_usecase.dart'
    as _i8;
import 'package:customer_app/features/salon_discovery/domain/usecases/get_nearby_salons_usecase.dart'
    as _i795;
import 'package:customer_app/features/salon_discovery/domain/usecases/get_salons_usecase.dart'
    as _i765;
import 'package:customer_app/features/uploads/data/datasources/upload_remote_datasource.dart'
    as _i1033;
import 'package:customer_app/features/uploads/data/repositories/upload_repository_impl.dart'
    as _i145;
import 'package:customer_app/features/uploads/domain/repositories/upload_repository.dart'
    as _i680;
import 'package:customer_app/features/uploads/domain/usecases/upload_files_usecase.dart'
    as _i825;
import 'package:flutter_secure_storage/flutter_secure_storage.dart' as _i558;
import 'package:get_it/get_it.dart' as _i174;
import 'package:image_picker/image_picker.dart' as _i183;
import 'package:injectable/injectable.dart' as _i526;

extension GetItInjectableX on _i174.GetIt {
  // initializes the registration of main-scope dependencies inside of GetIt
  _i174.GetIt init({
    String? environment,
    _i526.EnvironmentFilter? environmentFilter,
  }) {
    final gh = _i526.GetItHelper(this, environment, environmentFilter);
    final appModule = _$AppModule();
    gh.factory<_i219.LocationService>(() => _i219.LocationService());
    gh.lazySingleton<_i440.ApiClient>(() => appModule.apiClient);
    gh.lazySingleton<_i558.FlutterSecureStorage>(() => appModule.secureStorage);
    gh.lazySingleton<_i183.ImagePicker>(() => appModule.imagePicker);
    gh.factory<_i655.BookingRemoteDataSource>(
      () => _i655.BookingRemoteDataSourceImpl(gh<_i440.ApiClient>()),
    );
    gh.factory<_i801.ReviewsRemoteDataSource>(
      () => _i801.ReviewsRemoteDataSourceImpl(gh<_i440.ApiClient>()),
    );
    gh.factory<_i437.SalonsRemoteDataSource>(
      () => _i437.SalonsRemoteDataSourceImpl(gh<_i440.ApiClient>()),
    );
    gh.factory<_i273.UserRemoteDataSource>(
      () => _i273.UserRemoteDataSourceImpl(gh<_i440.ApiClient>()),
    );
    gh.factory<_i370.OnboardingLocalDataSource>(
      () => _i370.OnboardingSecureStorageDataSource(
        gh<_i558.FlutterSecureStorage>(),
      ),
    );
    gh.factory<_i468.UserRepository>(
      () => _i320.UserRepositoryImpl(gh<_i273.UserRemoteDataSource>()),
    );
    gh.factory<_i329.ReviewsRepository>(
      () => _i389.ReviewsRepositoryImpl(gh<_i801.ReviewsRemoteDataSource>()),
    );
    gh.factory<_i730.AuthRemoteDataSource>(
      () => _i730.AuthRemoteDataSourceImpl(gh<_i440.ApiClient>()),
    );
    gh.factory<_i582.AppointmentsRemoteDataSource>(
      () => _i582.AppointmentsRemoteDataSourceImpl(gh<_i440.ApiClient>()),
    );
    gh.factory<_i797.FavoritesRemoteDataSource>(
      () => _i797.FavoritesRemoteDataSourceImpl(gh<_i440.ApiClient>()),
    );
    gh.factory<_i543.NotificationRemoteDataSource>(
      () => _i543.NotificationRemoteDataSourceImpl(gh<_i440.ApiClient>()),
    );
    gh.factory<_i1033.UploadRemoteDataSource>(
      () => _i1033.UploadRemoteDataSourceImpl(gh<_i440.ApiClient>()),
    );
    gh.factory<_i819.SalonDetailRemoteDataSource>(
      () => _i819.SalonDetailRemoteDataSourceImpl(gh<_i440.ApiClient>()),
    );
    gh.factory<_i115.CategoriesRemoteDataSource>(
      () => _i115.CategoriesRemoteDataSourceImpl(gh<_i440.ApiClient>()),
    );
    gh.factory<_i750.AuthLocalDataSource>(
      () => _i750.AuthLocalDataSourceImpl(gh<_i558.FlutterSecureStorage>()),
    );
    gh.factory<_i1029.CreateReviewUseCase>(
      () => _i1029.CreateReviewUseCase(gh<_i329.ReviewsRepository>()),
    );
    gh.factory<_i122.GetMyReviewsUseCase>(
      () => _i122.GetMyReviewsUseCase(gh<_i329.ReviewsRepository>()),
    );
    gh.factory<_i667.NotificationRepository>(
      () => _i667.NotificationRepositoryImpl(
        gh<_i543.NotificationRemoteDataSource>(),
      ),
    );
    gh.factory<_i512.SalonDetailRepository>(
      () => _i272.SalonDetailRepositoryImpl(
        gh<_i819.SalonDetailRemoteDataSource>(),
      ),
    );
    gh.factory<_i834.ConfirmEmailChangeUseCase>(
      () => _i834.ConfirmEmailChangeUseCase(gh<_i468.UserRepository>()),
    );
    gh.factory<_i341.GetProfileUseCase>(
      () => _i341.GetProfileUseCase(gh<_i468.UserRepository>()),
    );
    gh.factory<_i823.RequestEmailChangeUseCase>(
      () => _i823.RequestEmailChangeUseCase(gh<_i468.UserRepository>()),
    );
    gh.factory<_i1012.UpdateProfileUseCase>(
      () => _i1012.UpdateProfileUseCase(gh<_i468.UserRepository>()),
    );
    gh.factory<_i1024.SalonsRepository>(
      () => _i840.SalonsRepositoryImpl(gh<_i437.SalonsRemoteDataSource>()),
    );
    gh.factory<_i2.OnboardingRepository>(
      () =>
          _i95.OnboardingRepositoryImpl(gh<_i370.OnboardingLocalDataSource>()),
    );
    gh.factory<_i855.ImagePickerService>(
      () => _i855.ImagePickerService(gh<_i183.ImagePicker>()),
    );
    gh.factory<_i896.AppointmentsRepository>(
      () => _i703.AppointmentsRepositoryImpl(
        gh<_i582.AppointmentsRemoteDataSource>(),
      ),
    );
    gh.factory<_i1055.FavoritesRepository>(
      () =>
          _i901.FavoritesRepositoryImpl(gh<_i797.FavoritesRemoteDataSource>()),
    );
    gh.factory<_i576.BookingRepository>(
      () => _i737.BookingRepositoryImpl(gh<_i655.BookingRemoteDataSource>()),
    );
    gh.factory<_i988.AuthRepository>(
      () => _i715.AuthRepositoryImpl(
        gh<_i730.AuthRemoteDataSource>(),
        gh<_i750.AuthLocalDataSource>(),
      ),
    );
    gh.factory<_i159.CategoriesRepository>(
      () => _i610.CategoriesRepositoryImpl(
        gh<_i115.CategoriesRemoteDataSource>(),
      ),
    );
    gh.factory<_i796.GetNotificationsUseCase>(
      () => _i796.GetNotificationsUseCase(gh<_i667.NotificationRepository>()),
    );
    gh.factory<_i619.GetUnreadCountUseCase>(
      () => _i619.GetUnreadCountUseCase(gh<_i667.NotificationRepository>()),
    );
    gh.factory<_i464.MarkAllNotificationsReadUseCase>(
      () => _i464.MarkAllNotificationsReadUseCase(
        gh<_i667.NotificationRepository>(),
      ),
    );
    gh.factory<_i527.MarkNotificationReadUseCase>(
      () =>
          _i527.MarkNotificationReadUseCase(gh<_i667.NotificationRepository>()),
    );
    gh.factory<_i506.CreateBookingUseCase>(
      () => _i506.CreateBookingUseCase(gh<_i576.BookingRepository>()),
    );
    gh.factory<_i78.GetAvailableSlotsUseCase>(
      () => _i78.GetAvailableSlotsUseCase(gh<_i576.BookingRepository>()),
    );
    gh.factory<_i680.UploadRepository>(
      () => _i145.UploadRepositoryImpl(gh<_i1033.UploadRemoteDataSource>()),
    );
    gh.factory<_i932.CancelAppointmentUseCase>(
      () => _i932.CancelAppointmentUseCase(gh<_i896.AppointmentsRepository>()),
    );
    gh.factory<_i886.GetAppointmentsUseCase>(
      () => _i886.GetAppointmentsUseCase(gh<_i896.AppointmentsRepository>()),
    );
    gh.factory<_i825.UploadFilesUseCase>(
      () => _i825.UploadFilesUseCase(gh<_i680.UploadRepository>()),
    );
    gh.factory<_i938.ForgotPasswordUseCase>(
      () => _i938.ForgotPasswordUseCase(gh<_i988.AuthRepository>()),
    );
    gh.factory<_i634.LoginUseCase>(
      () => _i634.LoginUseCase(gh<_i988.AuthRepository>()),
    );
    gh.factory<_i676.LogoutUseCase>(
      () => _i676.LogoutUseCase(gh<_i988.AuthRepository>()),
    );
    gh.factory<_i450.RegisterUseCase>(
      () => _i450.RegisterUseCase(gh<_i988.AuthRepository>()),
    );
    gh.factory<_i116.ResetPasswordUseCase>(
      () => _i116.ResetPasswordUseCase(gh<_i988.AuthRepository>()),
    );
    gh.factory<_i370.GetSalonDetailUseCase>(
      () => _i370.GetSalonDetailUseCase(gh<_i512.SalonDetailRepository>()),
    );
    gh.factory<_i412.GetSalonReviewsUseCase>(
      () => _i412.GetSalonReviewsUseCase(gh<_i512.SalonDetailRepository>()),
    );
    gh.factory<_i795.GetNearbySalonsUseCase>(
      () => _i795.GetNearbySalonsUseCase(gh<_i1024.SalonsRepository>()),
    );
    gh.factory<_i765.GetSalonsUseCase>(
      () => _i765.GetSalonsUseCase(gh<_i1024.SalonsRepository>()),
    );
    gh.factory<_i319.GetFavoriteIdsUseCase>(
      () => _i319.GetFavoriteIdsUseCase(gh<_i1055.FavoritesRepository>()),
    );
    gh.factory<_i627.ToggleFavoriteUseCase>(
      () => _i627.ToggleFavoriteUseCase(gh<_i1055.FavoritesRepository>()),
    );
    gh.factory<_i260.GetOnboardingSeenUseCase>(
      () => _i260.GetOnboardingSeenUseCase(gh<_i2.OnboardingRepository>()),
    );
    gh.factory<_i925.MarkOnboardingSeenUseCase>(
      () => _i925.MarkOnboardingSeenUseCase(gh<_i2.OnboardingRepository>()),
    );
    gh.factory<_i337.ResetOnboardingSeenUseCase>(
      () => _i337.ResetOnboardingSeenUseCase(gh<_i2.OnboardingRepository>()),
    );
    gh.factory<_i8.GetCategoriesUseCase>(
      () => _i8.GetCategoriesUseCase(gh<_i159.CategoriesRepository>()),
    );
    return this;
  }
}

class _$AppModule extends _i977.AppModule {}
