import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({}, { status: 503 });

  try {
    const { data, error } = await supabase
      .from("config")
      .select("data")
      .eq("id", 1)
      .single();

    if (error) return NextResponse.json({});
    return NextResponse.json(data?.data ?? {});
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "No Supabase" }, { status: 503 });

  try {
    const body = await req.json();
    const { error } = await supabase
      .from("config")
      .upsert([{ id: 1, data: body }]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
