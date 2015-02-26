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
      name: 'Default',
      cols: ['Column 1']
    },
    {
      id: 2,
      name: 'Lean Coffee',
      cols: [
        'To Discuss',
        'Discussing',
        'Done'
      ]
    },
    {
      id: 3,
      name: 'Retro Lite',
      cols: [
        'What Went Well',
        "What Didn't Go Well"
      ]
    },
    {
      id: 4,
      name: 'Retro Full',
      cols: [
        'Shout-outs',
        'What Went Well',
        "What Didn't Go Well",
        'Opportunities'
      ]
    },
    {
      id: 5,
      name: 'Banker Board',
      cols: [
        'Dudebro',
        'Dudebro',
        'Dudebro',
        'Dudebro',
        'Boomski'
      ]
    }
  ]

};
