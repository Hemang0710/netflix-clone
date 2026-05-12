import { getCurrentUser } from "@/lib/auth";

export async function GET(request) {
    try {
        const user = await getCurrentUser();
        return Response.json({ user });
    } catch (error) {
        console.error("Error fetching user:", error);
        return Response.json({ user: null }, { status: 401 });
    }
}
