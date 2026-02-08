# Generated manually

from django.db import migrations, models


def migrate_profile_data(apps, schema_editor):
    """Migrate first_name and last_name to name"""
    Profile = apps.get_model('acoount', 'Profile')
    for profile in Profile.objects.all():
        if profile.first_name or profile.last_name:
            name_parts = []
            if profile.first_name:
                name_parts.append(profile.first_name)
            if profile.last_name:
                name_parts.append(profile.last_name)
            profile.name = ' '.join(name_parts)
            profile.save(update_fields=['name'])


class Migration(migrations.Migration):

    dependencies = [
        ('acoount', '0003_profile'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='name',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='نام'),
        ),
        migrations.RunPython(migrate_profile_data, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='profile',
            name='first_name',
        ),
        migrations.RemoveField(
            model_name='profile',
            name='last_name',
        ),
    ]
