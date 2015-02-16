var colsets = [
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
];

module.exports = {
  all: function() {
    return colsets;
  },
  byId: function() {
    var ret = {};
    colsets.forEach(function(s) { ret[s.id] = s; });
    return ret;
  }
};
