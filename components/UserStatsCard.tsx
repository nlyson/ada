import React, { useEffect, useState } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

type UserStats = {
  challengesCompleted: number;
  highChallengeScore: number;
  avgChallengeScore: number;
  avgChallengeScoreCount?: number;
  scavengerMonthlyScore: number;
  avgScavengerScore: number;
  avgScavengerScoreCount?: number;
  photosUploaded?: number;
  threadsStarted?: number;
  feedbackGiven?: number;
  profileCompleteness?: number;
  streakDays?: number;
  topScoringCategory?: string;
};

type Props = {
  username: string;
  isOwner: boolean;
};

const FETCH_USER_STATS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_user_stats"

export const UserStatsCard: React.FC<Props> = ({ username, isOwner }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;
    const fetchStats = async () => {
      try {
        const res = await invokeLambdaIam({
            url: FETCH_USER_STATS_LAMBDA_URL,
            method: "POST",
            body: { username },
        });


        setStats(res);
      } catch (err: any) {
        console.error(err);
        if (err.message?.includes("404")) {
          setStats(null); // No stats yet
        } else {
          setError(err.message || "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [username]);

  if (loading) return <div>Loading stats...</div>;
  if (error) return <div>Error loading stats: {error}</div>;
  if (!stats) {
    return (
      <div className="border rounded-xl p-4 shadow bg-white dark:bg-gray-900 mt-4">
        <h2 className="text-xl font-semibold mb-2">📊 User Stats</h2>
        <p className="text-gray-500 text-sm">
          No stats yet. Start participating in challenges and scavenger hunts to see your progress here!
        </p>
      </div>
    );
  }
  return (
    <div className="border rounded-xl p-4 shadow bg-white dark:bg-gray-900 mt-4">
      <h2 className="text-xl font-semibold mb-2">📊 User Stats</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
        <li>Challenges Completed: {stats.challengesCompleted}</li>
        <li>High Challenge Score: {stats.highChallengeScore}</li>
        <li>Avg. Challenge Score: {stats.avgChallengeScore?.toFixed(2)}</li>
        <li>Scavenger Monthly Score: {stats.scavengerMonthlyScore}</li>
        <li>Avg. Scavenger Score: {stats.avgScavengerScore?.toFixed(2)}</li>
        {stats.photosUploaded !== undefined && <li>Photos Uploaded: {stats.photosUploaded}</li>}
        {stats.feedbackGiven !== undefined && <li>Feedback Given: {stats.feedbackGiven}</li>}
        {stats.threadsStarted !== undefined && <li>Threads Started: {stats.threadsStarted}</li>}
        {stats.streakDays !== undefined && <li>Streak: {stats.streakDays} day(s)</li>}
        {stats.profileCompleteness !== undefined && (
          <li>Profile Completeness: {stats.profileCompleteness}%</li>
        )}
        {stats.topScoringCategory && <li>Top Rubric Category: {stats.topScoringCategory}</li>}
      </ul>
      {isOwner && (
        <p className="text-sm text-gray-500 mt-2">
          Keep shooting! These stats update automatically after each submission.
        </p>
      )}
    </div>
  );
};
