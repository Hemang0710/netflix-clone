import { z } from "zod"

//Auth schemas

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one capital letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")

export const registerSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .email("Invalid email format"),
    password: passwordSchema,
})

export const loginSchema = z.object({
    email: z.string().min(1,"Email is required").email("Invalid email"),
    password: z.string().min(1,"Password is required"),
})

//Content schemas
export const contentSchema = z.object({
    title: z
        .string()
        .min(1,"Title is required")
        .max(100,"Title too long"),
    description: z.string().max(500,"Description too long").optional(),
    videoUrl: z.string().url("Invalid video URL"),
    thumbnaiUrl: z.string().url("Invalid thumbnail URL").optional().nullable(),
    price: z.number().min(0,"Price cannot be negative").max(999,"Price too high"),
    genre: z.enum([
        "General", "Action", "Comedy", "Drama",
        "Sci-Fi", "Horror", "Documentary", "Education"
    ]),
})

// Watchlist schema
export const watchlistSchema = z.object({
    tmdbId: z.number().int().positive("Invalid movie ID"),
    title: z.string().min(1,"Title is required"),
    posterPath: z.string().optional().nullable(),
})

//Helper - returns formatted errors
export function validateBody(schema,body){
    const result = schema.safeParse(body)

    if(!result.success){
        const errors = result.error.flatten().fieldErrors
        // Get the first error message for each field
        const firstErrors = Object.entries(errors).reduce((acc,[field,msgs]) => {
            acc[field] = msgs[0]
            return acc
        },{})

        return{success: false, errors:firstErrors, data:null}
    }

    return {success:true, errors: null, data:result.data}
}