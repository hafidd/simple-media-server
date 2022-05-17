const { env } = process;

const config = {
  PORT: env.PORT || 3200,
  MONGO: env.MONGO || "",
};

module.exports = config;
