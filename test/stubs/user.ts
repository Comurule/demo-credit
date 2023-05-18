import { faker } from '@faker-js/faker';

export default (
  first_name = faker.internet.userName(),
  last_name = faker.internet.userName(),
  email = faker.internet.email(),
  password = faker.string.alphanumeric(6),
) => ({ first_name, last_name, email, password });
