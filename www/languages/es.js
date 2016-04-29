(function() {
  var translations = {
    'title_search': 'Buscar',
    'title_create': 'Crear Persona',
    'title_edit': 'Editar Persona',
    'title_details': 'Detalles',
    'title_shelters': 'Refugios',
    'title_shelter_details': 'Shelter Details',
    'title_settings': 'Ajustes',
    'title_login': 'VIDA Iniciar sesion',
    'title_picture_dialog': 'Cuadro',
    'login_username': 'Usuario',
    'login_password': 'Clave',
    'login_message': 'Inicia sesion con tu cuenta VIDA',
    'dialog_confirm_cancel': 'Estas seguro que quieres cancelar?',
    'dialog_confirm_delete': 'Estas seguro de querer borrar a esta persona?',
    'dialog_retrieving_list': 'Lista de las personas Recuperando..',
    'dialog_retrieving_list_complete': 'Recuperacion Lista terminada!',
    'dialog_error_person_exists': 'La persona ya existe!',
    'dialog_error_person_no_name': 'Introduzca por lo menos un nombre para cargar una nueva persona.',
    'dialog_error_person_no_name_edit': 'Please enter at least a name to complete your saved changes.',
    'dialog_error_username_password': 'Por favor, introduzca un nombre de usuario y contrasena!',
    'dialog_error_username': 'Por favor, introduzca un nombre de usuario!',
    'dialog_error_password': 'Por favor, introduzca un nombre de contrasena!',
    'dialog_photo_uploaded': 'La foto se ha subido para ',
    'dialog_person_uploaded': ' se ha subido correctamente!',
    'dialog_person_exists': 'Persona ya existe!',
    'modal_picture_take_picture': 'Tomar foto',
    'modal_picture_choose_from_library': 'Elija de la biblioteca',
    'modal_picture_remove_picture': 'Eliminar foto',
    'modal_cancel': 'Cancelar',
    'tab_search': 'Buscar',
    'tab_create': 'Crear',
    'tab_shelter': 'Refugios',
    'tab_settings': 'Ajustes',
    'tab_edit': 'Editar',
    'tab_delete': 'Borrar',
    'tab_save': 'Guardar',
    'tab_cancel': 'Cancelar',
    'tab_back': 'Regresa',
    'person_given_name': 'Nombre de Pila',
    'person_family_name': 'Apellido',
    'person_fathers_given_name': 'Nombre Padres Dada',
    'person_mothers_given_name': 'Nombre Madres Dada',
    'person_age': 'Anos',
    'person_date_of_birth': 'Fecha de cumpleanos',
    'person_street_and_number': 'Direccion',
    'person_city': 'Ciudad',
    'person_neighborhood': 'Barrio',
    'person_description': 'Descripcion',
    'person_gender': 'Genero',
    'person_not_specified': 'No especificado',
    'person_gender_male': 'Masculino',
    'person_gender_female': 'Mujer',
    'person_gender_other': 'Otros',
    'person_status': 'Status',
    'person_status_not_injured': 'Not Injured',
    'person_status_injured': 'Injured',
    'person_status_deceased': 'Deceased',
    'person_status_displaced': 'Lost/Displaced',
    'person_score': 'Tanto',
    'person_injury': 'Lesion',
    'person_injury_not_injured': 'No Lesionado',
    'person_injury_moderate': 'Moderar',
    'person_injury_severe': 'Grave',
    'person_nationality': 'Nationality',
    'person_nationality_english': 'English',
    'person_nationality_african': 'African American',
    'person_nationality_asian': 'Asian',
    'person_nationality_american_indian': 'American Indian',
    'person_nationality_hispanic_latino': 'Hispanic/Latino',
    'person_nationality_caucasian': 'Caucasian/White',
    'person_nationality_other': 'Other',
    'person_phone_number': 'Numero de telefono',
    'person_created_by': 'Creado por',
    'person_barcode': 'Codigo de Barras',
    'person_current_shelter': 'Location',
    'button_save': 'Guardar',
    'button_login': 'Iniciar sesion',
    'button_logout': 'Cerrar sesion',
    'button_request_account': 'O solicitar una cuenta',
    'button_shelter_search': 'Back to Shelter Map',
    'button_update_database': 'Sync People/Shelters',
    'search_searchfield': 'Buscar',
    'search_age': 'Anos',
    'settings_cache_photos': 'Cache Fotos',
    'settings_language': 'Idioma',
    'settings_language_english': 'Ingles',
    'settings_language_spanish': 'Espanol',
    'settings_server_ip': 'Servidor IP',
    'error_retrieving_info': 'Recuperacion de informacion..',
    'error_wrong_credentials': 'Incorrect Username or Password!',
    'error_connecting_server': 'A problem occurred when connecting to the server. Status: ',
    'error_no_results': 'No results found.',
    'error_couldnt_get_results': 'Could not get results. Please try again.',
    'error_search_person_error': 'Could not load person details. Error: ',
    'error_upload_person_failed': 'Uploading person failed. Please check your internet connection.',
    'error_uploading_person': 'Error uploading person: ',
    'loading_face_search': 'Loading Best Possible Matches..',
    'dialog_box_title_saving': 'Saving',
    'dialog_box_message_uploading': 'Saving and uploading information for ',
    'dialog_box_message_saving_settings': 'Saving settings..',
    'dialog_clear_fields_title': 'Clear Fields',
    'dialog_clear_fields_message': 'Are you sure you want to clear all fields?',
    'toast_added_person_locally': 'Added person locally: ',
    'dialog_location_title':'Found Previous Location!',
    'dialog_location_prev_location': 'Use Previous Location',
    'dialog_location_curr_location': 'Use Current Location',
    'attempting_login': 'Attempting Login..',
    'successfully_logged_in': 'Successfully logged in!',
  };

  var module = angular.module('vida-translations-es', ['pascalprecht.translate']);

  module.config(function($translateProvider) {
    $translateProvider.translations('es', translations);
  });

}());
