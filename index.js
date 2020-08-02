const {
  ApolloServer,
  gql,
  AuthenticationError,
  ForbiddenError,
} = require('apollo-server');

const users = [
  {
    token: 'a1b2c3',
    email: 'user@email.com',
    username: 'user',
    password: '1234',
    roles: ['user'],
  },
  {
    token: 'e4f5g6',
    email: 'admin@email.com',
    username: 'admin',
    password: '456',
    roles: ['user', 'admin'],
  },
];

const typeDefs = gql`
  type Query {
    ping: String
    authenticate(username: String, password: String): String
    me: User
    users: [User]
  }

  type User {
    username: String!
    email: String!
  }
`;

const resolvers = {
  Query: {
    ping: () => 'pong',
    authenticate: (parent, { username, password }) => {
      const found = users.find(
        (user) => user.username === username && user.password === password
      );
      console.log(found);
      return found && found.token;
    },
    me: (parent, args, { user }) => {
      if (!user) throw new AuthenticationError('not authenticated');
      return user;
    },
    users: (parent, args, { user }) => {
      if (!user) throw new AuthenticationError('not authenticated');
      if (!user.roles.includes('admin'))
        throw new ForbiddenError('not authorized');
      return users;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // if (!req.headers.authorization)
    //   throw new AuthenticationError('missing token');

    if (!req.headers.authorization) return { user: undefined };

    const token = req.headers.authorization.substr(7);
    const user = users.find((user) => user.token === token);
    // if (!user) throw new AuthenticationError('invalid token');
    return { user };
  },
});

server.listen().then(({ url }) => {
  console.log(`Listening at ${url}`);
});
