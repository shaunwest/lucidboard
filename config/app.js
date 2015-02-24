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
      name: 'Lean Coffee',
      cols: [
        'To Discuss',
        'Discussing',
        'Done'
      ]
    },
    {
      id: 2,
      name: 'Retro Lite',
      cols: [
        'What Went Well',
        "What Didn't Go Well"
      ]
    },
    {
      id: 3,
      name: 'Retro Full',
      cols: [
        'Shout-outs',
        'What Went Well',
        "What Didn't Go Well",
        'Opportunities'
      ]
    }
  ]

};
