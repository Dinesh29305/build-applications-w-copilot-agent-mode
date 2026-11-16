import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const data = input as Record<string, unknown>;
  
  // Validate required fields
  if (!data.userId || !data.teamId || !data.type || !data.minutes) {
    const error = new Error('Missing required fields: userId, teamId, type, minutes');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  // Validate userId and teamId are valid MongoDB ObjectIds
  if (!mongoose.Types.ObjectId.isValid(data.userId as string)) {
    const error = new Error('Invalid userId format');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(data.teamId as string)) {
    const error = new Error('Invalid teamId format');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  // Verify user exists
  const user = await User.findById(data.userId);
  if (!user) {
    const error = new Error('User not found');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  // Verify team exists
  const team = await Team.findById(data.teamId);
  if (!team) {
    const error = new Error('Team not found');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  // Calculate points (simple: points = minutes)
  const points = Number(data.minutes);

  // Create activity
  const activity = await Activity.create({
    user: data.userId,
    team: data.teamId,
    type: data.type,
    minutes: data.minutes,
    points,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const data = input as Record<string, unknown>;

  // Validate required fields
  if (!data.name || !data.mascot) {
    const error = new Error('Missing required fields: name, mascot');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  // Create team with optional members
  const team = await Team.create({
    name: data.name,
    mascot: data.mascot,
    members: (data.members as string[] | undefined) || [],
  });

  return team.toObject();
}

export async function getLeaderboard() {
  // Aggregate activities by team to get total points
  const results = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'teamInfo',
      },
    },
    {
      $unwind: '$teamInfo',
    },
    {
      $sort: { totalPoints: -1 },
    },
  ]);

  // Add rank and format response
  return results.map((result, index) => ({
    teamName: result.teamInfo.name,
    totalPoints: result.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  // Decode email (it comes URL-encoded from the route parameter)
  const decodedEmail = decodeURIComponent(userEmail);

  // Find user by email
  const user = await User.findOne({ email: decodedEmail });
  if (!user) {
    const error = new Error('User not found');
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  // Get user's fitness goal
  const goal = user.fitnessGoal;

  // Get user's most recent activity type
  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const recentType = recentActivity?.type;

  // Find workouts that match either the goal or recent activity type
  let workouts = await Workout.find().lean();

  // Sort workouts by match quality
  const scored = workouts.map((workout) => {
    let score = 0;
    let reason = 'Recommended based on ';
    const reasons: string[] = [];

    if (workout.focus === goal) {
      score += 2;
      reasons.push(`your ${goal} goal`);
    }

    if (recentType && workout.focus.toLowerCase().includes(recentType.toLowerCase())) {
      score += 1;
      reasons.push(`your recent ${recentType} activity`);
    }

    if (score === 0) {
      score = 0.5;
      reasons.push('your activity');
    }

    reason += reasons.join(' and ');

    return { ...workout, score, reason };
  });

  // Sort by score (descending) and return top 1
  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return [];
  }

  const top = scored[0];
  return [
    {
      title: top.title,
      focus: top.focus,
      minutes: top.minutes,
      difficulty: top.difficulty,
      reason: top.reason,
    },
  ];
}

export { User };
