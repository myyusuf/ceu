"use strict"

const flow = require('nimble');
const moment = require('moment');

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
       if (err) { reply('Error while doing operation.').code(500); return; }
       reply(rows);
     });
};

exports.createByLevel = function createByLevel(request, reply) {

  const studentId = request.payload.studentId;
  const level = request.payload.tingkat;
  const sufix = request.payload.sufix;
  const planStartDate = moment(request.payload.tanggal_mulai, 'YYYY-MM-DD');
  const series = [];
  const db = this.db;
  const result = { status: 'OK' };

  let departments = [];

  const findDepartmentsByLevel = function findDepartmentsByLevel(callback) {
    const query = 'SELECT * FROM tb_bagian WHERE tingkat = ?';

    db.query(
      query, [level],
       (err, rows) => {
         if (err) { callback(err); return; }
         departments = rows;
         callback();
       });
  };

  const createDepartments = function createDepartments(callback) {
    const parallels = [];
    const WEEK_BRAKE = 2;
    let tmpPlanStartDate = planStartDate;
    const planDates = [];

    for (let i = 0; i < departments.length; i += 1) {
      if (i > 0) {
        tmpPlanStartDate = tmpPlanStartDate.add(departments[i].durasi_minggu + WEEK_BRAKE, 'weeks');
      }
      const planEndDate = moment(tmpPlanStartDate).add(departments[i].durasi_minggu, 'weeks');
      const hospital1StartDate = moment(tmpPlanStartDate);
      const hospital1EndDate = moment(hospital1StartDate).add(departments[i].durasi_minggu_rs1, 'weeks');
      const clinicStartDate = moment(hospital1EndDate);
      const clinicEndDate = moment(clinicStartDate).add(departments[i].durasi_minggu_klinik, 'weeks');
      const hospital2StartDate = moment(clinicEndDate);
      const hospital2EndDate = moment(hospital2StartDate).add(departments[i].durasi_minggu_rs2, 'weeks');

      planDates.push({
        planStartDate: moment(tmpPlanStartDate),
        planEndDate,
        hospital1StartDate,
        hospital1EndDate,
        clinicStartDate,
        clinicEndDate,
        hospital2StartDate,
        hospital2EndDate,
      });
    }

    for (let i = 0; i < departments.length; i += 1) {
      // ---Closure
      (function f() {
        const department = departments[i];
        const planDate = planDates[i];
        const createDepartment = function createDepartment(paralleCallback) {
          db.query(`
            INSERT INTO tb_bagian_diambil
            SET
              siswa_id = ?,
              bagian_id = ?,
              judul = ?,
              plan_start_date = ?,
              plan_end_date = ?,
              hospital1_plan_start_date = ?,
              hospital1_plan_end_date = ?,
              clinic_plan_start_date = ?,
              clinic_plan_end_date = ?,
              hospital2_plan_start_date = ?,
              hospital2_plan_end_date = ?
            `,
            [
              studentId,
              department.id,
              `${department.nama} ${sufix}`,
              planDate.planStartDate.toDate(),
              planDate.planEndDate.toDate(),
              planDate.hospital1StartDate.toDate(),
              planDate.hospital1EndDate.toDate(),
              planDate.clinicStartDate.toDate(),
              planDate.clinicEndDate.toDate(),
              planDate.hospital2StartDate.toDate(),
              planDate.hospital2EndDate.toDate(),
            ], (err, result) => {
              if (err) {
                console.dir(err);
                paralleCallback(err);
                return;
              }
              paralleCallback();
            });
        };
        parallels.push(createDepartment);
      })();
      //----------
    }

    flow.parallel(parallels, (error) => {
      if (error) {
        console.log(error);
        db.rollback(() => {
          callback(error);
        });
      } else {
        db.commit((errCommit) => {
          if (errCommit) {
            db.rollback(() => {
              callback(error);
            });
          }
          callback();
        });
      }
    });
  };

  series.push(findDepartmentsByLevel, createDepartments);

  db.beginTransaction((err) => {
    if (err) { throw err; }
    flow.series(series, (error) => {
      if (error) {
        console.log(error);
        db.rollback(() => {
          reply('Error while doing operation.').code(500);
        });
      } else {
        db.commit((errCommit) => {
          if (errCommit) {
            db.rollback(() => {
              reply('Error while doing operation.').code(500);
            });
          }
          reply(result);
        });
      }
    });
  });
};
