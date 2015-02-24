module.exports.app = {
  /*
   * Sigin methods:
   *
   *   - ldap: edit config/ldap.js to configure
   *   - dumb: username input only
   */
  signin: 'dumb',

  colsets: [
    {
      id: 1,
      name: 'One Column',
      cols: ['First Column']
    },
    {
      id: 2,
      name: 'Retrospective',
      cols: [
        'What Went Well',
        "What Didn't go Well"
      ]
    },
  ]

};
