exports.find = function findTakenDepartments(request, reply) {
  const db = this.db;

  const siswaId = request.params.siswaId;

  const query = `
    SELECT tb.nama, tbd.* FROM tb_bagian_diambil tbd
    LEFT JOIN tb_bagian tb ON tbd.bagian_id = tb.id
    WHERE tbd.siswa_id = ?
  `;

  db.query(
    query, [siswaId],
     (err, rows) => {
       if (err) reply('Error while doing operation.').code(500);
       reply(rows);
     }
  );
};
