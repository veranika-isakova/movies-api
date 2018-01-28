import { makeExecutableSchema } from 'graphql-tools';
import http from 'request-promise-json';

const MOVIE_DB_API_KEY = process.env.MOVIE_DB_API_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY;

const typeDefs = `
  enum Currency {
    EUR
    GBP
    USD
  }
  interface Media {
    id: ID!,
    title: String!
  }
  type Collection {
    id: ID!,
    name: String,
    poster_path: String,
    backdrop_path: String
  }
  type Movie implements Media {
    id: ID!
    adult: Boolean,
    backdrop_path: String,
    belongs_to_collection: Collection,
    budget(currency: Currency = EUR): Int,
    title: String!,
    imdb_id: ID!
  }
  type TVShow implements Media {
    id: ID!
    title: String!
    media_type: String!
    running: Boolean
  }
  type Person {
    profile_path: String!
    adult: Boolean!,
    id: ID!,
    known_for: [Media],
    name: String!,
    popularity: Float!
  }
  union SearchResult = Movie | TVShow | Person
  type Rating {
    """
    This is the value of the rating you want to submit. The value is expected to be between 0.5 and 10.0.
    """
    value: Float!
  }
  # the schema allows the following query:
  type Query {
    movies: [Movie]
    movie(id: ID, imdb_id: String): Movie
  }
  type Mutation {
    upvoteMovie (
      movieId: Int!,
    ): Movie,
    rateMovie (
      movieId: Int!,
      rating: Float!
    ): Rating
  }
`;

const resolvers = {
  Query: {
    movie: async (obj, args, context, info) => {
      if (args.id) {
        return http
          .get(`https://api.themoviedb.org/3/movie/${args.id}?api_key=${MOVIE_DB_API_KEY}&language=en-US`)
      }
      if (args.imdb_id) {
        const results = await http
          .get(`https://api.themoviedb.org/3/find/${args.imdb_id}?api_key=${MOVIE_DB_API_KEY}&language=en-US&external_source=imdb_id`)

        if (results.movie_results.length > 0) {
          const movieId = results.movie_results[0].id
          return http
            .get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${MOVIE_DB_API_KEY}&language=en-US`)
        }
      }
    },
    movies: async (obj, args, context, info) => {
        const whole_result = await http.get(`https://api.themoviedb.org/3/discover/movie?api_key=${MOVIE_DB_API_KEY}&language=en-US`)
        return whole_result.results;
      },
  },
  Mutation: {
   rateMovie: async (obj, args, context, info) => {
     const movie = await http
       .get(`https://api.themoviedb.org/3/movie/${args.id}?api_key=${MOVIE_DB_API_KEY}&language=en-US`)

     if (!movie) {
       throw new Error(`Couldn't find movie with id ${args.id}`);
     }

     return http
       .post(
         `https://api.themoviedb.org/3/movie/${args.id}/rating?api_key=${MOVIE_DB_API_KEY}&language=en-US`,
         { value: rating }
       )
   }
 }
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export default schema;
