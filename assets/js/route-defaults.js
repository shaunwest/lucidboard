(function() {
  'use strict';

  angular.module('hansei.routes').
    constant('appStateDefaults', {
      title: 'Hansei',
      headerUrl: '/templates/header-footer/header.html',
      footerUrl: '/templates/header-footer/footer.html'
    });
})();