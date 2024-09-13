'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('drivers', 'name', {
        type: Sequelize.STRING,
        allowNull: false,
      }),
      queryInterface.addColumn('drivers', 'taxiType', {
        type: Sequelize.STRING,
        allowNull: false,
      }),
      queryInterface.addColumn('drivers', 'carName', {
        type: Sequelize.STRING,
        allowNull: false,
      }),
      queryInterface.addColumn('drivers', 'carModel', {
        type: Sequelize.STRING,
        allowNull: false,
      }),
      queryInterface.addColumn('drivers', 'carYear', {
        type: Sequelize.INTEGER,
        allowNull: false,
      }),
      queryInterface.addColumn('drivers', 'carRegistration', {
        type: Sequelize.STRING,
        allowNull: false,
      }),
      queryInterface.addColumn('drivers', 'licensePlate', {
        type: Sequelize.STRING,
        allowNull: false,
      }),
      queryInterface.addColumn('drivers', 'isTaxiClean', {
        type: Sequelize.STRING,  // Or BOOLEAN if you prefer
        allowNull: false,
      }),
      queryInterface.addColumn('drivers', 'passengerCapacity', {
        type: Sequelize.INTEGER,
        allowNull: false,
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('drivers', 'name'),
      queryInterface.removeColumn('drivers', 'taxiType'),
      queryInterface.removeColumn('drivers', 'carName'),
      queryInterface.removeColumn('drivers', 'carModel'),
      queryInterface.removeColumn('drivers', 'carYear'),
      queryInterface.removeColumn('drivers', 'carRegistration'),
      queryInterface.removeColumn('drivers', 'licensePlate'),
      queryInterface.removeColumn('drivers', 'isTaxiClean'),
      queryInterface.removeColumn('drivers', 'passengerCapacity'),
    ]);
  }
};
