// (function() {
//   'use strict';
//
//   // ty, http://adamalbrecht.com/2013/12/12/creating-a-simple-modal-dialog-directive-in-angular-js/
//   angular.module('hansei.ui')
//     .directive('modalDialog', [function() {
//       return {
//
//         restrict:    'E',
//         templateUrl: '/templates/_modalDialog.html',
//         scope:       {
//           show:      '='
//         },
//         replace:     true,
//         transclude:  true,
//
//         link: function(scope, element, attrs) {
//           scope.dialogStyle = {};
//
//           if (attrs.width)  scope.dialogStyle.width  = attrs.width;
//           if (attrs.height) scope.dialogStyle.height = attrs.height;
//
//           scope.hideModal = function() {
//             scope.show = false;
//           };
//         }
//       };
//     }])
//
// })();
