import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * @file route.ts
 * @description 댓글 삭제 API
 *
 * 주요 기능:
 * 1. 댓글 삭제 (본인 댓글만)
 * 2. 본인 댓글 검증
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증
 * - @/lib/supabase/service-role: Supabase 클라이언트
 */

interface DeleteCommentParams {
  commentId: string;
}

/**
 * DELETE: 댓글 삭제
 *
 * @description
 * - 특정 댓글을 삭제합니다.
 * - 본인 댓글만 삭제 가능합니다.
 * - 댓글의 user_id와 현재 사용자의 user_id를 비교하여 권한을 확인합니다.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<DeleteCommentParams> },
) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 경로 파라미터 추출 (Next.js 15)
    const { commentId } = await params;

    if (!commentId || typeof commentId !== "string") {
      return NextResponse.json(
        { error: "Bad Request", details: "commentId is required" },
        { status: 400 },
      );
    }

    // Supabase 클라이언트
    const supabase = getServiceRoleClient();

    // Clerk user_id를 Supabase users 테이블의 id로 변환
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { error: "User not found", details: "Failed to find user in database" },
        { status: 404 },
      );
    }

    const userId = userData.id;

    // 댓글 존재 확인 및 본인 댓글 검증
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single();

    if (commentError) {
      if (commentError.code === "PGRST116") {
        // 댓글이 존재하지 않음
        return NextResponse.json(
          { error: "Not Found", details: "Comment not found" },
          { status: 404 },
        );
      }
      console.error("Comment query error:", commentError);
      return NextResponse.json(
        { error: "Internal server error", details: commentError.message },
        { status: 500 },
      );
    }

    if (!commentData) {
      return NextResponse.json(
        { error: "Not Found", details: "Comment not found" },
        { status: 404 },
      );
    }

    // 본인 댓글인지 검증
    if (commentData.user_id !== userId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          details: "You can only delete your own comments",
        },
        { status: 403 },
      );
    }

    // 댓글 삭제 (이중 검증: id와 user_id 모두 확인)
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId); // 추가 보안: 본인 댓글만 삭제

    if (deleteError) {
      console.error("Delete comment error:", deleteError);
      return NextResponse.json(
        {
          error: "Failed to delete comment",
          details: deleteError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/comments/[commentId] error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
