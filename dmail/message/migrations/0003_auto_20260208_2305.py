# Generated manually

from django.db import migrations, models
import uuid


def generate_public_links(apps, schema_editor):
    """Generate public links for existing messages"""
    Message = apps.get_model('message', 'Message')
    for message in Message.objects.all():
        if not message.public_link:
            message.public_link = uuid.uuid4()
            message.save(update_fields=['public_link'])


class Migration(migrations.Migration):

    dependencies = [
        ('message', '0002_remove_message_privacy'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='public_link',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name='لینک عمومی'),
        ),
        migrations.RunPython(generate_public_links, migrations.RunPython.noop),
    ]
